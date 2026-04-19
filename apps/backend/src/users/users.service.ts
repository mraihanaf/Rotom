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
        role: true,
      },
    });
    
    // Ensure role is always a string
    const mappedItems = items.map(item => ({
      ...item,
      role: item.role || 'user',
    }));
    
    return buildCursorPagination(mappedItems, limit, (item) => item.id);
  }

  async updateUserRole(
    userId: string,
    role: string,
    currentUserId: string,
  ): Promise<{ id: string; name: string; image: string | null; role: string }> {
    // Self-protection: cannot change own role
    if (userId === currentUserId) {
      throw new Error('Cannot change your own role');
    }

    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
      },
    });

    this.logger.log(`Updated user ${userId} role to ${role}`);
    return {
      ...updated,
      role: updated.role || 'user',
    };
  }
}
