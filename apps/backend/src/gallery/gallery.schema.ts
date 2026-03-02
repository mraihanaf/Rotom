import z from 'zod';

export const ALLOWED_CONTENT_FILETYPES = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MEDIA_TYPE = z.enum(['video', 'image']);

export const GalleryPostSchema = z.object({
  id: z.cuid(),
  createdBy: z.object({
    userId: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }),
  reactions: z.record(z.string(), z.number()),
  myReaction: z.emoji().nullable(),
  type: MEDIA_TYPE,
  createdAt: z.iso.datetime().or(z.date()),
  url: z.string(),
});

export const PostUserReactionsSchema = z.object({
  id: z.cuid(),
  emoji: z.emoji(),
  createdBy: z.object({
    userId: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }),
});

export const getAllPostsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getAllPostsOutputSchema = z.object({
  items: z.array(GalleryPostSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export const deletePostByIdInputSchema = z.object({
  id: z.cuid(),
});

export const getPostUserReactionsInputSchema = z.object({
  postId: z.cuid(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getPostUserReactionsOutputSchema = z.object({
  items: z.array(PostUserReactionsSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export const reactPostByIdInputSchema = z.object({
  postId: z.cuid(),
  emoji: z.emoji(),
});

export const deleteReactionByPostIdInputSchema = z.object({
  postId: z.cuid(),
});

export const createPostInputSchema = z.file();
