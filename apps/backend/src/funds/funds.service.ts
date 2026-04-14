import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
} from 'src/common/utils/cursorPagination';
import { PrismaService } from 'src/prisma/prisma.service';

interface IAddFundContribution {
  userContributorId: string | null | undefined;
  userReporterId: string;
  amount: number;
  note: string | null;
  type: 'INCOME' | 'EXPENSE';
}

@Injectable()
export class FundsService {
  constructor(public readonly prismaService: PrismaService) {}

  async createContribution(input: IAddFundContribution) {
    return this.prismaService.$transaction(async (tx) => {
      // For EXPENSE, if no contributor provided, use the reporter
      const contributorId = input.userContributorId?.trim() || input.userReporterId;

      const reporterExists = await tx.user.count({
        where: { id: input.userReporterId },
      });

      if (!reporterExists) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Reporter does not exist',
        });
      }

      // Validate contributor exists (skip if null - will use reporter as fallback)
      if (contributorId && contributorId !== input.userReporterId) {
        const contributorExists = await tx.user.count({
          where: { id: contributorId },
        });

        if (!contributorExists) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Contributor does not exist',
          });
        }
      }

      const fund = await tx.fund.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          totalAmount: 0,
          currency: 'IDR',
        },
        update: {},
      });

      await tx.fundContributionLog.create({
        data: {
          amount: input.amount,
          contributorId,
          reporterId: input.userReporterId,
          note: input.note,
          currency: fund.currency,
          type: input.type,
        },
      });

      const amountChange = input.type === 'INCOME' ? input.amount : -input.amount;
      await tx.fund.update({
        where: { id: 1 },
        data: {
          totalAmount: {
            increment: amountChange,
          },
        },
      });
    });
  }

  async getAllContributions({
    cursor,
    limit = 20,
    orderBy = 'desc',
  }: {
    cursor?: string;
    limit?: number;
    orderBy?: 'desc' | 'asc';
  }) {
    const contributions = await this.prismaService.fundContributionLog.findMany(
      {
        take: limit + 1,
        ...buildPrismaCursorPaginationArgs(cursor),
        orderBy: {
          createdAt: orderBy,
        },
        include: {
          contributor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    );

    const mapped = contributions.map((contribution) => ({
      id: contribution.id,
      currency: contribution.currency,
      amount: contribution.amount,
      note: contribution.note,
      type: contribution.type,
      createdAt: contribution.createdAt,
      contributor: contribution.contributor,
      reporter: contribution.reporter,
    }));

    return buildCursorPagination(mapped, limit, (item) => item.id);
  }

  async getFund() {
    let fund = await this.prismaService.fund.findFirst();
    if (!fund) {
      fund = await this.prismaService.fund.create({});
    }
    return {
      totalAmount: fund?.totalAmount,
      currency: fund?.currency,
    };
  }

  async deleteContributionById(id: string) {
    return this.prismaService.$transaction(async (tx) => {
      const contribution = await tx.fundContributionLog.findUnique({
        where: { id },
      });

      if (!contribution) {
        throw new ORPCError('NOT_FOUND');
      }

      const amountChange = contribution.type === 'INCOME' ? -contribution.amount : contribution.amount;
      await tx.fund.update({
        where: { id: 1 },
        data: {
          totalAmount: {
            increment: amountChange,
          },
        },
      });

      await tx.fundContributionLog.delete({
        where: { id },
      });
    });
  }
}
