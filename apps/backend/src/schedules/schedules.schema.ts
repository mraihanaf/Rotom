import z from 'zod';

export const scheduleSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
});

export const getScheduleByDayInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
});

export const getScheduleByDayOutputSchema = z.array(scheduleSchema);

export const createScheduleInputSchema = z.object({
  subjectId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable().optional(),
});

export const updateScheduleInputSchema = z.object({
  id: z.string(),
  subjectId: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().nullable().optional(),
});

export const deleteScheduleInputSchema = z.object({
  id: z.string(),
});

export const getWeekScheduleOutputSchema = z.array(scheduleSchema);
