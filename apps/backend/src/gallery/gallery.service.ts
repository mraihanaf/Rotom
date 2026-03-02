import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import sharp from 'sharp';
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
} from 'src/common/utils/cursorPagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { Readable } from 'stream';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from 'src/@generated/prisma/client';

@Injectable()
export class GalleryService {
  constructor(
    public readonly prismaService: PrismaService,
    public readonly storageService: StorageService,
  ) {}

  async getPostUserReactions({
    postId,
    cursor,
    limit = 20,
    orderBy = 'desc',
  }: {
    postId: string;
    limit?: number;
    cursor?: string;
    orderBy?: 'desc' | 'asc';
  }) {
    const postUserReactions =
      await this.prismaService.galleryPostReaction.findMany({
        take: limit + 1,
        ...buildPrismaCursorPaginationArgs(cursor),
        orderBy: { createdAt: orderBy },
        where: {
          postId,
        },
        select: {
          id: true,
          emoji: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

    return buildCursorPagination(
      postUserReactions.map((reaction) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        createdBy: {
          userId: reaction.user.id,
          name: reaction.user.name,
          image: reaction.user.image,
        },
      })),
      limit,
      (reaction) => reaction.id,
    );
  }

  async deletePostReaction({
    postId,
    userId,
  }: {
    postId: string;
    userId: string;
  }) {
    try {
      return await this.prismaService.galleryPostReaction.deleteMany({
        where: {
          postId,
          userId,
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

  async upsertPostReaction({
    postId,
    userId,
    emoji,
  }: {
    postId: string;
    userId: string;
    emoji: string;
  }) {
    return this.prismaService.$transaction(async (tx) => {
      const post = await tx.galleryPost.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Post not found',
        });
      }

      await this.deletePostReaction({ postId, userId });

      return tx.galleryPostReaction.upsert({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
        create: {
          postId,
          userId,
          emoji,
        },
        update: {
          emoji,
        },
      });
    });
  }

  async getAllPosts({
    cursor,
    limit = 20,
    orderBy = 'desc',
    userId,
  }: {
    limit?: number;
    cursor?: string;
    orderBy?: 'desc' | 'asc';
    userId: string;
  }) {
    const posts = await this.prismaService.galleryPost.findMany({
      take: limit + 1,
      ...buildPrismaCursorPaginationArgs(cursor),
      orderBy: { createdAt: orderBy },
      select: {
        id: true,
        createdAt: true,
        type: true,
        mediaKey: true,
        userId: true,
        createdBy: {
          select: { name: true, id: true, image: true },
        },
      },
    });

    if (posts.length === 0)
      return buildCursorPagination([], limit, (post) => post);

    const postIds = posts.map((post) => post.id);

    const [reactionCounts, myReactions] = await Promise.all([
      this.prismaService.galleryPostReaction.groupBy({
        by: ['postId', 'emoji'],
        where: { postId: { in: postIds } },
        _count: { emoji: true },
      }),
      this.prismaService.galleryPostReaction.findMany({
        where: {
          postId: { in: postIds },
          userId,
        },
        select: {
          postId: true,
          emoji: true,
        },
      }),
    ]);

    const reactionsMap = new Map<string, Record<string, number>>();
    const myReactionMap = new Map<string, string>();

    for (const { postId, emoji, _count } of reactionCounts) {
      if (!reactionsMap.has(postId)) {
        reactionsMap.set(postId, {});
      }
      reactionsMap.get(postId)![emoji] = _count.emoji;
    }

    for (const { postId, emoji } of myReactions) {
      myReactionMap.set(postId, emoji);
    }

    const mapped = await Promise.all(
      posts.map(async (post) => {
        const url = await this.storageService.getPresignedDownloadUrl({
          key: post.mediaKey,
        });

        return {
          id: post.id,
          createdBy: {
            userId: post.createdBy.id,
            name: post.createdBy.name,
            image: post.createdBy.image,
          },
          reactions: reactionsMap.get(post.id) ?? {},
          myReaction: myReactionMap.get(post.id) ?? null,
          type: post.type,
          createdAt: post.createdAt,
          url,
        };
      }),
    );

    return buildCursorPagination(mapped, limit, (post) => post.id);
  }

  async createPost({ file, userId }: { file: File; userId: string }) {
    if (!file.type.startsWith('image/')) {
      throw new ORPCError('BAD_REQUEST');
    }

    const mediaKey = `posts/${userId}/${createId()}.webp`;

    const webStream =
      file.stream() as unknown as import('stream/web').ReadableStream;

    const nodeStream = Readable.fromWeb(webStream);

    const webpStream = nodeStream.pipe(sharp().rotate().webp());

    await this.storageService.uploadStreamFileToS3({
      key: mediaKey,
      body: webpStream,
      contentType: 'image/webp',
    });

    await this.prismaService.galleryPost.create({
      data: {
        type: 'image',
        userId,
        mediaKey,
      },
    });
  }

  async deletePostById({
    id,
    userId,
    isAdmin,
  }: {
    id: string;
    userId: string;
    isAdmin: boolean;
  }) {
    const mediaKey = await this.prismaService.$transaction(async (tx) => {
      const post = await tx.galleryPost.findUnique({
        where: { id },
        select: { userId: true, mediaKey: true },
      });

      if (!post) {
        throw new ORPCError('NOT_FOUND');
      }

      if (!isAdmin && post.userId !== userId) {
        throw new ORPCError('FORBIDDEN');
      }
      await tx.galleryPost.delete({
        where: { id },
      });
      return post.mediaKey;
    });

    await this.storageService.deleteObject({ key: mediaKey });
  }
}
