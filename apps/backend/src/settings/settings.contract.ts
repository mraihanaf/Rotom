import { oc } from '@orpc/contract';
import { whatsappSettingsSchema, updateWhatsappSettingsInputSchema } from './settings.schema';
import { z } from 'zod';

const getWhatsappSettings = oc
  .route({
    path: '/settings/whatsapp',
    method: 'GET',
    tags: ['Settings'],
  })
  .output(whatsappSettingsSchema);

const updateWhatsappSettings = oc
  .route({
    path: '/settings/whatsapp',
    method: 'PUT',
    tags: ['Settings'],
  })
  .input(updateWhatsappSettingsInputSchema)
  .output(whatsappSettingsSchema);

const getPublicWhatsappSettings = oc
  .route({
    path: '/settings/whatsapp/public',
    method: 'GET',
    tags: ['Settings'],
  })
  .output(
    z.object({
      dutyReminderTime: z.string(),
      scheduleReminderTime: z.string(),
      assignmentReminderTime: z.string(),
      birthdayReminderTime: z.string(),
      fundReportDay: z.number(),
      fundReportTime: z.string(),
      ENABLE_WHATSAPP_BOT_FUND_REPORT: z.boolean(),
      ENABLE_WHATSAPP_BOT_DUTY_REPORT: z.boolean(),
      ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: z.boolean(),
      ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: z.boolean(),
      ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: z.boolean(),
    })
  );

export const settingsContract = {
  getWhatsappSettings,
  updateWhatsappSettings,
  getPublicWhatsappSettings,
};
