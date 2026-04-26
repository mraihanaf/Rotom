import { Injectable, Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { createId } from '@paralleldrive/cuid2';
import { Readable } from 'stream';
import sharp from 'sharp';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async createNameChangeRequest(
    userId: string,
    requestedName: string,
    source: 'COMPLETE_PROFILE' | 'PROFILE_EDIT',
  ) {
    // Cancel any existing pending requests for this user
    await this.prismaService.userNameChangeRequest.updateMany({
      where: {
        userId,
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        rejectionReason: 'Superseded by new request',
      },
    });

    // Create new pending request
    return this.prismaService.userNameChangeRequest.create({
      data: {
        userId,
        requestedName,
        status: 'PENDING',
        source,
      },
    });
  }

  private async publishNameChangeRequestCreated(requestId: string) {
    const request = await this.prismaService.userNameChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request || !request.user) {
      this.logger.warn(`Unable to publish name change notification for missing request ${requestId}`);
      return;
    }

    const admins = await this.prismaService.user.findMany({
      where: {
        role: 'ADMIN',
        phoneNumber: {
          not: null,
        },
      },
      select: {
        phoneNumber: true,
      },
    });

    await this.notificationsService.publishNameChangeRequestCreated({
      requestId: request.id,
      userId: request.userId,
      userName: request.user.name,
      userEmail: request.user.email,
      requestedName: request.requestedName,
      requestedAt: request.requestedAt.toISOString(),
      adminPhoneNumbers: admins
        .map((admin) => admin.phoneNumber)
        .filter((phoneNumber): phoneNumber is string => Boolean(phoneNumber)),
    });
  }

  async completeProfile(userId: string, input: { name: string; birthday: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { isProfileComplete: true, name: true },
    });

    if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

    if (user.isProfileComplete) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Profile is already complete',
      });
    }

    // Create pending name change request instead of updating name directly
    const nameRequest = await this.createNameChangeRequest(
      userId,
      input.name,
      'COMPLETE_PROFILE',
    );

    // Complete profile with birthday only
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        birthday: new Date(input.birthday),
        isProfileComplete: true,
      },
    });

    this.logger.log(`Profile completed for user ${userId}, name change request ${nameRequest.id} created`);

    await this.publishNameChangeRequestCreated(nameRequest.id);
    await this.notificationsService.publishSchedulerResyncAll('profile.completed');

    return { nameRequestId: nameRequest.id };
  }

  async updateProfile(userId: string, input: { name: string; birthday: string | null }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

    // Check if name is being changed
    let nameRequestId: string | undefined;
    if (input.name !== user.name) {
      // Create pending name change request instead of updating name directly
      const nameRequest = await this.createNameChangeRequest(
        userId,
        input.name,
        'PROFILE_EDIT',
      );
      nameRequestId = nameRequest.id;
      this.logger.log(`Name change request ${nameRequest.id} created for user ${userId}`);
    }

    // Update birthday directly
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        birthday: input.birthday ? new Date(input.birthday) : null,
      },
    });

    if (nameRequestId) {
      await this.publishNameChangeRequestCreated(nameRequestId);
    }

    await this.notificationsService.publishSchedulerResyncAll('profile.updated');

    this.logger.log(`Profile updated for user ${userId}`);
    return { ...updatedUser, pendingNameRequestId: nameRequestId };
  }

  async getPendingNameRequest(userId: string) {
    return this.prismaService.userNameChangeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async getNameRequestStatus(userId: string) {
    const pendingRequest = await this.getPendingNameRequest(userId);
    return {
      hasPendingRequest: !!pendingRequest,
      pendingRequestedName: pendingRequest?.requestedName ?? null,
      pendingRequestId: pendingRequest?.id ?? null,
    };
  }

  async updateProfileImage(userId: string, file: File) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'File must be an image',
      });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'File too large. Max size: 5MB',
      });
    }

    // Generate key for S3
    const extension = 'webp';
    const mediaKey = `profiles/${userId}/${createId()}.${extension}`;

    // Process and upload image
    const webStream =
      file.stream() as unknown as import('stream/web').ReadableStream;
    const nodeStream = Readable.fromWeb(webStream);

    const uploadStream = nodeStream.pipe(
      sharp()
        .rotate()
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 }),
    );

    await this.storageService.uploadStreamFileToS3({
      key: mediaKey,
      body: uploadStream,
      contentType: 'image/webp',
    });

    // Get presigned URL for the uploaded image
    const imageUrl = await this.storageService.getPresignedDownloadUrl({
      key: mediaKey,
    });

    // Update user profile with new image URL
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    this.logger.log(`Profile image updated for user ${userId}`);
    return updatedUser;
  }

  // Admin methods for name change requests
  async getPendingNameChangeRequests() {
    return this.prismaService.userNameChangeRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'asc',
      },
    });
  }

  async approveNameChangeRequest(requestId: string, adminUserId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const request = await tx.userNameChangeRequest.findUnique({
        where: { id: requestId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
      });

      if (!request) {
        throw new ORPCError('NOT_FOUND', { message: 'Name change request not found' });
      }

      if (request.status !== 'PENDING') {
        throw new ORPCError('BAD_REQUEST', { message: 'Request is not pending' });
      }

      // Update user's name
      await tx.user.update({
        where: { id: request.userId },
        data: { name: request.requestedName },
      });

      // Mark request as approved
      const updatedRequest = await tx.userNameChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: adminUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
      });

      this.logger.log(`Name change request ${requestId} approved by admin ${adminUserId}`);

      return {
        request: updatedRequest,
        previousName: request.user.name,
        newName: request.requestedName,
      };
    });
  }

  async rejectNameChangeRequest(requestId: string, adminUserId: string, reason?: string) {
    const request = await this.prismaService.userNameChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
      },
    });

    if (!request) {
      throw new ORPCError('NOT_FOUND', { message: 'Name change request not found' });
    }

    if (request.status !== 'PENDING') {
      throw new ORPCError('BAD_REQUEST', { message: 'Request is not pending' });
    }

    const updatedRequest = await this.prismaService.userNameChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: adminUserId,
        rejectionReason: reason ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
          },
        },
      },
    });

    this.logger.log(`Name change request ${requestId} rejected by admin ${adminUserId}`);

    return updatedRequest;
  }
}
