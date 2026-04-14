import { Injectable, Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import { Prisma } from 'src/@generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(public readonly prismaService: PrismaService) {}

  async getByDay(dayOfWeek: number) {
    const items = await this.prismaService.subjectSchedule.findMany({
      where: { dayOfWeek },
      orderBy: { startTime: 'asc' },
      include: { subject: { select: { name: true } } },
    });

    return items.map((item) => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectName: item.subject.name,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
    }));
  }

  async getWeek() {
    const items = await this.prismaService.subjectSchedule.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { subject: { select: { name: true } } },
    });

    return items.map((item) => ({
      id: item.id,
      subjectId: item.subjectId,
      subjectName: item.subject.name,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
    }));
  }

  async create(input: {
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string | null;
  }) {
    try {
      const item = await this.prismaService.subjectSchedule.create({
        data: {
          subjectId: input.subjectId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          room: input.room ?? null,
        },
        include: { subject: { select: { name: true } } },
      });

      return {
        id: item.id,
        subjectId: item.subjectId,
        subjectName: item.subject.name,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Subject not found',
        });
      }
      throw err;
    }
  }

  async update(input: {
    id: string;
    subjectId?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    room?: string | null;
  }) {
    try {
      await this.prismaService.subjectSchedule.update({
        where: { id: input.id },
        data: {
          ...(input.subjectId !== undefined && { subjectId: input.subjectId }),
          ...(input.dayOfWeek !== undefined && { dayOfWeek: input.dayOfWeek }),
          ...(input.startTime !== undefined && { startTime: input.startTime }),
          ...(input.endTime !== undefined && { endTime: input.endTime }),
          ...(input.room !== undefined && { room: input.room }),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }

  async deleteById(id: string) {
    try {
      await this.prismaService.subjectSchedule.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }
}
