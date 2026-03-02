import z from 'zod';

export const fundSchema = z.object({
  totalAmount: z.number(),
  currency: z.string(),
});

export const createFundContributionInputSchema = z.object({
  userContributorId: z.string(),
  amount: z.number(),
  note: z.string().nullable(),
});

export const contributionSchema = z.object({
  id: z.uuid(),
  contributor: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }),
  reporter: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }),
  amount: z.number(),
  note: z.string().nullable(),
  currency: z.string(),
  createdAt: z.date(),
});

export const getAllContributionsOuputSchema = z.object({
  items: z.array(contributionSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export const getAllContributionsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const deleteFundContributionByIdInputSchema = z.object({
  id: z.uuid(),
});
