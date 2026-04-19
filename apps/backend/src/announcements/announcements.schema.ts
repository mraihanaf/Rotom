import { z } from 'zod';

export const dutyPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  dutyType: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
  }),
});

export const scheduleItemSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
});

export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.date(),
  subject: z.object({
    id: z.string(),
    name: z.string(),
  }),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const birthdayPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  birthday: z.date(),
  age: z.number().optional(),
});

export const fundReportSchema = z.object({
  totalAmount: z.number(),
  currency: z.string(),
  monthIncome: z.number(),
  monthExpense: z.number(),
  monthNet: z.number(),
});

export const announcementSettingsSchema = z.object({
  announcementGroupJid: z.string().nullable(),
  ENABLE_WHATSAPP_BOT_FUND_REPORT: z.boolean(),
  ENABLE_WHATSAPP_BOT_DUTY_REPORT: z.boolean(),
  ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: z.boolean(),
  ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: z.boolean(),
  ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: z.boolean(),
  dutyReminderTime: z.string(),
  scheduleReminderTime: z.string(),
  assignmentReminderTime: z.string(),
  birthdayReminderTime: z.string(),
  fundReportDay: z.number(),
  fundReportTime: z.string(),
  dutyPersonalizedMessage: z.string(),
  birthdayMessageTemplate: z.string(),
  timezone: z.string(),
  updatedAt: z.string(),
});
