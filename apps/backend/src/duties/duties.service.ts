import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import { Prisma } from 'src/@generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DutiesService {
  constructor(public readonly prismaService: PrismaService) {}

  async getDutyById(id: string) {
    return await this.prismaService.duty.findUnique({
      where: {
        id,
      },
    });
  }

  async createDuty({ title }: { title: string }) {
    return await this.prismaService.duty.create({
      data: {
        title,
      },
    });
  }

  async updateDuty({ id, title }: { id: string; title: string }) {
    try {
      return await this.prismaService.duty.update({
        where: { id },
        data: { title },
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

  async deleteDutyById(id: string) {
    try {
      return await this.prismaService.duty.delete({
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

  async getAllDuties() {
    return await this.prismaService.duty.findMany();
  }
}
