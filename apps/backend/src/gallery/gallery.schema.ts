import z from 'zod';

export const ALLOWED_CONTENT_FILETYPES = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/mov',
]);

export const MEDIA_TYPE = z.enum(['video', 'image']);

export const MAX_VIDEO_DURATION_SECONDS = 30;
export const MAX_VIDEO_FILE_SIZE_MB = 50;
export const MAX_IMAGE_FILE_SIZE_MB = 10;

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

export const createPostInputSchema = z.object({
  file: z.instanceof(File),
});

// Validation helper for file size (in bytes)
export const MAX_VIDEO_FILE_SIZE_BYTES = MAX_VIDEO_FILE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_FILE_SIZE_BYTES = MAX_IMAGE_FILE_SIZE_MB * 1024 * 1024;
