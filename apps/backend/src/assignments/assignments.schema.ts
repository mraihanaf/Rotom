import z from 'zod';

export const assignmentSchema = z.object({
  id: z.cuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.iso.datetime().or(z.date()),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }),
  subject: z.object({
    id: z.cuid(),
    name: z.string(),
  }),
  done: z.boolean(),
});

export const getAllAssignmentsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getAllAssignmentsOutputSchema = z.object({
  items: z.array(assignmentSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});

export const assignmentInputSchema = z.object({
  id: z.string(),
});

export const createAssignmentInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.iso.datetime(),
  subjectId: z.cuid(),
});

export const updateAssignmentInputSchema = z.object({
  id: z.cuid(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.iso.datetime(),
  subjectId: z.cuid(),
});
