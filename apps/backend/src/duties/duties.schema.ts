import z from 'zod';

// Duty Type schemas
export const dutyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(), // Prisma returns string for enums
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const createDutyTypeInputSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['CLEANING', 'MBG']),
});

export const updateDutyTypeInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  category: z.enum(['CLEANING', 'MBG']).optional(),
});

export const deleteDutyTypeInputSchema = z.object({
  id: z.string(),
});

// Duty Schedule schemas
export const dutyStatusSchema = z.string(); // Prisma returns string for enums

export const dutyScheduleSchema = z.object({
  id: z.string(),
  dutyTypeId: z.string(),
  userId: z.string(),
  dayOfWeek: z.number().min(1).max(5), // Monday=1 to Friday=5
  status: dutyStatusSchema,
  completedAt: z.date().or(z.string()).nullable(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  dutyType: dutyTypeSchema.optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }).optional(),
});

export const createDutyScheduleInputSchema = z.object({
  dutyTypeId: z.string(),
  userId: z.string(),
  dayOfWeek: z.number().min(1).max(5),
});

export const updateDutyScheduleInputSchema = z.object({
  id: z.string(),
  dutyTypeId: z.string().optional(),
  userId: z.string().optional(),
  dayOfWeek: z.number().min(1).max(5).optional(),
});

export const deleteDutyScheduleInputSchema = z.object({
  id: z.string(),
});

export const updateDutyStatusInputSchema = z.object({
  id: z.string(),
  status: dutyStatusSchema,
});

// Weekly schedule output
export const dayScheduleSchema = z.object({
  dayOfWeek: z.number(),
  duties: z.array(dutyScheduleSchema),
});

export const weekScheduleOutputSchema = z.object({
  week: z.array(dayScheduleSchema),
});

// Get week duties input (optional filter)
export const getWeekDutiesInputSchema = z.object({
  weekStart: z.string().optional(), // ISO date string
});
