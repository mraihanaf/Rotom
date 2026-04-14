import z from 'zod';

export const subjectSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  createdAt: z.date(),
});

export const createSubjectInputSchema = z.object({
  name: z.string(),
});

export const updateSubjectInputSchema = z.object({
  id: z.cuid(),
  name: z.string(),
});

export const deleteSubjectByIdInputSchema = z.object({
  id: z.cuid(),
});

export const getAllSubjectsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getAllSubjectsOutputSchema = z.object({
  items: z.array(subjectSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});
