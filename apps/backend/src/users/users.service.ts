import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
} from 'src/common/utils/cursorPagination';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(public readonly prismaService: PrismaService) {}

  async getAll({ cursor, limit = 20 }: { cursor?: string; limit?: number }) {
    const items = await this.prismaService.user.findMany({
      take: limit + 1,
      ...buildPrismaCursorPaginationArgs(cursor),
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });
    return buildCursorPagination(items, limit, (item) => item.id);
  }
}
