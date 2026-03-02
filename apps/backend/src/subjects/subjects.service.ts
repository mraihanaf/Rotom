import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import { Prisma } from 'src/@generated/prisma/client';
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
} from 'src/common/utils/cursorPagination';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(public readonly prismaService: PrismaService) {}

  async createSubject(name: string) {
    try {
      await this.prismaService.subject.create({
        data: {
          name: name,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ORPCError('CONFLICT', {
          message: 'Subject Already Exists',
        });
      }
      throw err;
    }
  }

  async updateSubjectById({ id, name }: { id: string; name: string }) {
    try {
      return await this.prismaService.subject.update({
        where: { id },
        data: { name },
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

  async deleteSubjectById(id: string) {
    try {
      return await this.prismaService.subject.delete({
        where: { id },
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

  async getAllSubjects({
    cursor,
    limit = 20,
    orderBy = 'desc',
  }: {
    cursor?: string;
    limit?: number;
    orderBy?: 'desc' | 'asc';
  }) {
    const subjects = await this.prismaService.subject.findMany({
      take: limit + 1,
      ...buildPrismaCursorPaginationArgs(cursor),
      orderBy: {
        createdAt: orderBy,
      },
    });

    return buildCursorPagination(subjects, limit, (item) => item.id);
  }
}
