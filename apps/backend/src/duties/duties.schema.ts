import z from 'zod';

export const DutySchema = z.object({
  id: z.cuid(),
  title: z.string(),
  createdAt: z.iso.datetime().or(z.date()),
});

export const createDutyInputSchema = z.object({
  title: z.string(),
});

export const updateDutyInputSchema = z.object({
  id: z.cuid(),
  title: z.string(),
});

export const deleteDutyByIdInputSchema = z.object({
  id: z.cuid(),
});

export const deleteDutyInputSchema = z.object({
  id: z.cuid(),
});
