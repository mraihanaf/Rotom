import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateWhatsappSettingsInput, WhatsappSettings } from './settings.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrCreateSettings() {
    let settings = await this.prisma.settings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { id: 1 },
      });
    }

    return settings;
  }

  async getWhatsappSettings(): Promise<WhatsappSettings> {
    const settings = await this.getOrCreateSettings();

    return {
      ENABLE_WHATSAPP_BOT_FUND_REPORT: settings.ENABLE_WHATSAPP_BOT_FUND_REPORT,
      ENABLE_WHATSAPP_BOT_DUTY_REPORT: settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT,
      ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER,
      ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER,
      ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER ?? true,

      announcementGroupJid: settings.announcementGroupJid,

      dutyReminderLeadTime: (settings as any).dutyReminderLeadTime ?? settings.dutyReminderTime,
      scheduleReminderLeadTime: settings.scheduleReminderLeadTime,
      assignmentReminderLeadTime: (settings as any).assignmentReminderLeadTime ?? settings.assignmentReminderTime,
      birthdayReminderTime: settings.birthdayReminderTime,
      dutyReminderLeadDays: (settings as any).dutyReminderLeadDays ?? 0,
      scheduleReminderLeadDays: settings.scheduleReminderLeadDays ?? 0,
      assignmentReminderLeadDays: (settings as any).assignmentReminderLeadDays ?? 0,

      fundReportDay: settings.fundReportDay,
      fundReportTime: settings.fundReportTime,

      dutyPersonalizedMessage: settings.dutyPersonalizedMessage,
      birthdayMessageTemplate: settings.birthdayMessageTemplate,
      timezone: (settings as any).timezone || 'system',
    };
  }

  async updateWhatsappSettings(input: UpdateWhatsappSettingsInput): Promise<WhatsappSettings> {
    const currentSettings = await this.getOrCreateSettings();

    const updated = await this.prisma.settings.update({
      where: { id: 1 },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    this.logger.log('WhatsApp settings updated');
    await this.notificationsService.publishSchedulerResyncAll('settings.updated');

    return {
      ENABLE_WHATSAPP_BOT_FUND_REPORT: updated.ENABLE_WHATSAPP_BOT_FUND_REPORT,
      ENABLE_WHATSAPP_BOT_DUTY_REPORT: updated.ENABLE_WHATSAPP_BOT_DUTY_REPORT,
      ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: updated.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER,
      ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: updated.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER,
      ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: updated.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER ?? true,

      announcementGroupJid: updated.announcementGroupJid,

      dutyReminderLeadTime: (updated as any).dutyReminderLeadTime ?? updated.dutyReminderTime,
      scheduleReminderLeadTime: (updated as any).scheduleReminderLeadTime ?? updated.scheduleReminderTime,
      assignmentReminderLeadTime: (updated as any).assignmentReminderLeadTime ?? updated.assignmentReminderTime,
      birthdayReminderTime: updated.birthdayReminderTime,
      dutyReminderLeadDays: (updated as any).dutyReminderLeadDays ?? 0,
      scheduleReminderLeadDays: updated.scheduleReminderLeadDays ?? 0,
      assignmentReminderLeadDays: (updated as any).assignmentReminderLeadDays ?? 0,

      fundReportDay: updated.fundReportDay,
      fundReportTime: updated.fundReportTime,

      dutyPersonalizedMessage: updated.dutyPersonalizedMessage,
      birthdayMessageTemplate: updated.birthdayMessageTemplate,
      timezone: (updated as any).timezone || 'system',
    };
  }

  async getPublicWhatsappSettings() {
    const settings = await this.getWhatsappSettings();

    // Return only non-sensitive settings
    return {
      dutyReminderLeadTime: settings.dutyReminderLeadTime,
      scheduleReminderLeadTime: settings.scheduleReminderLeadTime,
      assignmentReminderLeadTime: settings.assignmentReminderLeadTime,
      birthdayReminderTime: settings.birthdayReminderTime,
      dutyReminderLeadDays: settings.dutyReminderLeadDays,
      scheduleReminderLeadDays: settings.scheduleReminderLeadDays ?? 0,
      assignmentReminderLeadDays: settings.assignmentReminderLeadDays,
      fundReportDay: settings.fundReportDay,
      fundReportTime: settings.fundReportTime,
      ENABLE_WHATSAPP_BOT_FUND_REPORT: settings.ENABLE_WHATSAPP_BOT_FUND_REPORT,
      ENABLE_WHATSAPP_BOT_DUTY_REPORT: settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT,
      ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER,
      ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER,
      ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER,
      timezone: settings.timezone,
    };
  }

  async getAnnouncementGroupJid(): Promise<string | null> {
    const settings = await this.getOrCreateSettings();
    return settings.announcementGroupJid;
  }
}
