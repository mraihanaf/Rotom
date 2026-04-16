import { Injectable, Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { createId } from '@paralleldrive/cuid2';
import { Readable } from 'stream';
import sharp from 'sharp';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async completeProfile(userId: string, input: { name: string; birthday: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { isProfileComplete: true },
    });

    if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

    if (user.isProfileComplete) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Profile is already complete',
      });
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        birthday: new Date(input.birthday),
        isProfileComplete: true,
      },
    });

    this.logger.log(`Profile completed for user ${userId}`);
  }

  async updateProfile(userId: string, input: { name: string; birthday: string | null }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        birthday: input.birthday ? new Date(input.birthday) : null,
      },
    });

    this.logger.log(`Profile updated for user ${userId}`);
    return updatedUser;
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
}
