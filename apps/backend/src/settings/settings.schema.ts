import { z } from 'zod';

export const whatsappSettingsSchema = z.object({
  // Enable flags
  ENABLE_WHATSAPP_BOT_FUND_REPORT: z.boolean().default(true),
  ENABLE_WHATSAPP_BOT_DUTY_REPORT: z.boolean().default(true),
  ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: z.boolean().default(true),
  ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: z.boolean().default(true),
  ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: z.boolean().default(true),

  // Announcement group configuration
  announcementGroupJid: z.string().nullable().optional(),

  // Reminder times (HH:MM format)
  dutyReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('07:00'),
  scheduleReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('07:00'),
  assignmentReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00'),
  birthdayReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),

  // Fund report configuration
  fundReportDay: z.number().int().min(1).max(31).default(1),
  fundReportTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),

  // Message templates
  dutyPersonalizedMessage: z.string().default('jangan lupa piket hari ini ya {name}!'),
  birthdayMessageTemplate: z.string().default('Selamat ulang tahun {name}! Semoga panjang umur dan sehat selalu!'),

  // Timezone configuration
  timezone: z.string().default('system'),
});

export const updateWhatsappSettingsInputSchema = whatsappSettingsSchema.partial();

export type WhatsappSettings = z.infer<typeof whatsappSettingsSchema>;
export type UpdateWhatsappSettingsInput = z.infer<typeof updateWhatsappSettingsInputSchema>;
