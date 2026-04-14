import { Injectable, Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly prismaService: PrismaService) {}

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
}
