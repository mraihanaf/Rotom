import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ORPCError } from '@orpc/contract';
import { SubjectsService } from 'src/subjects/subjects.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
  CursorPaginationParams,
} from 'src/common/utils/cursorPagination';
import { Prisma } from 'src/@generated/prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(
    public readonly prismaService: PrismaService,
    public readonly subjectsService: SubjectsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAssignmentById(id: string) {
    return await this.prismaService.assignment.findUnique({
      where: { id },
    });
  }

  async getAssignmentStatus({
    assignmentId,
    userId,
  }: {
    assignmentId: string;
    userId: string;
  }) {
    const assignmentStatus =
      await this.prismaService.assignmentStatus.findFirst({
        where: {
          userId,
          assignmentId,
        },
      });

    if (!assignmentStatus)
      return this.prismaService.assignmentStatus.create({
        data: {
          userId,
          assignmentId,
        },
      });

    return assignmentStatus;
  }

  async setAssignmentStatus({
    userId,
    assignmentId,
    done,
  }: {
    userId: string;
    assignmentId: string;
    done: boolean;
  }) {
    return this.prismaService.assignmentStatus.upsert({
      where: {
        assignmentId_userId: {
          userId,
          assignmentId,
        },
      },
      create: {
        userId,
        assignmentId,
        done,
      },
      update: {
        done,
      },
    });
  }

  async markAssignment({
    assignmentId,
    userId,
  }: {
    assignmentId: string;
    userId: string;
  }) {
    return this.setAssignmentStatus({
      assignmentId,
      userId,
      done: true,
    });
  }

  async unmarkAssignment({
    assignmentId,
    userId,
  }: {
    assignmentId: string;
    userId: string;
  }) {
    return this.setAssignmentStatus({
      assignmentId,
      userId,
      done: false,
    });
  }

  async createAssignment({
    title,
    description = null,
    subjectId,
    creatorId,
    dueDate,
  }: {
    title: string;
    description?: string | null;
    subjectId: string;
    creatorId: string;
    dueDate: string | Date;
  }) {
    try {
      const created = await this.prismaService.assignment.create({
        data: {
          title,
          description,
          subjectId,
          dueDate,
          createdBy: creatorId,
        },
      });
      await this.notificationsService.publishSchedulerResyncAll('assignments.created');
      return created;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ORPCError('NOT_FOUND', { message: 'Subject not found' });
      }
      throw e;
    }
  }

  async deleteAssignmentById(id: string) {
    try {
      const deleted = await this.prismaService.assignment.delete({
        where: { id },
      });
      await this.notificationsService.publishSchedulerResyncAll('assignments.deleted');
      return deleted;
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

  async updateAssignmentById(input: {
    id: string;
    title: string;
    description?: string | null;
    dueDate: string | Date;
    subjectId: string;
  }) {
    try {
      const updated = await this.prismaService.assignment.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description ?? null,
          dueDate: input.dueDate,
          subjectId: input.subjectId,
        },
      });
      await this.notificationsService.publishSchedulerResyncAll('assignments.updated');
      return updated;
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

  async getAllAssignments(
    params: CursorPaginationParams<string> & {
      userId: string;
    },
  ) {
    const { cursor, limit = 20, orderBy = 'desc', userId } = params;

    const assignments = await this.prismaService.assignment.findMany({
      take: limit + 1,
      ...buildPrismaCursorPaginationArgs(cursor),
      orderBy: {
        createdAt: orderBy,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        assignmentStatuses: {
          where: {
            userId: userId,
          },
          take: 1,
          select: {
            done: true,
          },
        },
      },
    });

    const mapped = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      subject: a.subject,
      createdBy: a.user,
      done: a.assignmentStatuses[0]?.done ?? false,
    }));

    return buildCursorPagination(mapped, limit, (item) => item.id);
  }
}
