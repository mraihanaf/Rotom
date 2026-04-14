import z from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
});

export const getAllUsersInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getAllUsersOutputSchema = z.object({
  items: z.array(userSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});
