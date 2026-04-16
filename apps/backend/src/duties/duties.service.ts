import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import { Prisma } from 'src/@generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DutiesService {
  constructor(public readonly prismaService: PrismaService) {}

  // Duty Type methods
  async createDutyType({ name, category }: { name: string; category: string }) {
    return await this.prismaService.dutyType.create({
      data: { name, category },
    });
  }

  async updateDutyType({ id, name, category }: { id: string; name?: string; category?: string }) {
    try {
      return await this.prismaService.dutyType.update({
        where: { id },
        data: { name, category },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }

  async deleteDutyType(id: string) {
    try {
      await this.prismaService.dutyType.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }

  async getAllDutyTypes() {
    return await this.prismaService.dutyType.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  // Duty Schedule methods
  async createDutySchedule({ dutyTypeId, userId, dayOfWeek }: { dutyTypeId: string; userId: string; dayOfWeek: number }) {
    try {
      return await this.prismaService.dutySchedule.create({
        data: { dutyTypeId, userId, dayOfWeek, status: 'SCHEDULED' },
        include: { dutyType: true, user: { select: { id: true, name: true, image: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ORPCError('CONFLICT', { message: 'User already assigned to this duty on this day' });
      }
      throw err;
    }
  }

  async updateDutySchedule({ id, dutyTypeId, userId, dayOfWeek }: { id: string; dutyTypeId?: string; userId?: string; dayOfWeek?: number }) {
    try {
      return await this.prismaService.dutySchedule.update({
        where: { id },
        data: { dutyTypeId, userId, dayOfWeek },
        include: { dutyType: true, user: { select: { id: true, name: true, image: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ORPCError('NOT_FOUND');
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ORPCError('CONFLICT', { message: 'User already assigned to this duty on this day' });
      }
      throw err;
    }
  }

  async deleteDutySchedule(id: string) {
    try {
      await this.prismaService.dutySchedule.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }

  async updateDutyStatus({ id, status }: { id: string; status: string }) {
    try {
      const completedAt = status === 'COMPLETED' ? new Date() : null;
      return await this.prismaService.dutySchedule.update({
        where: { id },
        data: { status, completedAt },
        include: { dutyType: true, user: { select: { id: true, name: true, image: true } } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }

  async getWeekDuties(input?: { weekStart?: string }) {
    // Get all duty schedules for the week (Mon-Fri = 1-5)
    const schedules = await this.prismaService.dutySchedule.findMany({
      where: {
        dayOfWeek: { in: [1, 2, 3, 4, 5] },
      },
      include: {
        dutyType: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
    });

    // Group by day
    const week = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek,
      duties: schedules.filter((s) => s.dayOfWeek === dayOfWeek),
    }));

    return { week };
  }
}
