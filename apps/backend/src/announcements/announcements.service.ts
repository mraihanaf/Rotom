import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ROLES } from '../common/enum';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async getTodayDuties() {
    const settings = await this.settingsService.getOrCreateSettings();
    const timezone = (settings as any).timezone || 'system';
    
    // Get current day in configured timezone
    const now = new Date();
    let dayOfWeek: number;
    if (timezone === 'system') {
      dayOfWeek = now.getDay();
    } else {
      const dayName = now.toLocaleString('en-US', { timeZone: timezone, weekday: 'long' }).toLowerCase();
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
      };
      dayOfWeek = dayMap[dayName] ?? now.getDay();
    }
    
    // Convert to Monday=1, Friday=5 format used in DutySchedule
    const normalizedDay = dayOfWeek === 0 ? 0 : dayOfWeek;

    const duties = await this.prisma.dutySchedule.findMany({
      where: { dayOfWeek: normalizedDay },
      include: {
        dutyType: true,
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    return duties.map((duty) => ({
      id: duty.user.id,
      name: duty.user.name,
      phoneNumber: duty.user.phoneNumber,
      dutyType: {
        id: duty.dutyType.id,
        name: duty.dutyType.name,
        category: duty.dutyType.category,
      },
    }));
  }

  async getTodaySchedule() {
    const settings = await this.settingsService.getOrCreateSettings();
    const timezone = (settings as any).timezone || 'system';
    
    // Get current day in configured timezone
    const now = new Date();
    let dayOfWeek: number;
    if (timezone === 'system') {
      dayOfWeek = now.getDay();
    } else {
      // Get day name in target timezone and map to number
      const dayName = now.toLocaleString('en-US', { timeZone: timezone, weekday: 'long' }).toLowerCase();
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
      };
      dayOfWeek = dayMap[dayName] ?? now.getDay();
    }

    const schedules = await this.prisma.subjectSchedule.findMany({
      where: { dayOfWeek },
      include: {
        subject: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return schedules.map((s) => ({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
    }));
  }

  async getPendingAssignments() {
    const today = new Date();
    // Get assignments due today or in the next 3 days
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: threeDaysLater,
        },
      },
      include: {
        subject: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      subject: {
        id: a.subject.id,
        name: a.subject.name,
      },
      createdBy: {
        id: a.user.id,
        name: a.user.name,
      },
    }));
  }

  async getTodayBirthdays() {
    const settings = await this.settingsService.getOrCreateSettings();
    const timezone = (settings as any).timezone || 'system';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Get today's month and day in configured timezone
    let todayMonth: number;
    let todayDay: number;
    if (timezone === 'system') {
      todayMonth = now.getMonth();
      todayDay = now.getDate();
    } else {
      const dateStr = now.toLocaleString('en-US', { timeZone: timezone, month: 'numeric', day: 'numeric' });
      const [m, d] = dateStr.split('/').map(Number);
      todayMonth = m - 1; // 0-indexed
      todayDay = d;
    }

    // Find users whose birthday is today (month and day match)
    const users = await this.prisma.user.findMany({
      where: {
        birthday: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        birthday: true,
      },
    });

    return users
      .filter((user) => {
        if (!user.birthday) return false;
        const bday = new Date(user.birthday);
        return bday.getMonth() === todayMonth && bday.getDate() === todayDay;
      })
      .map((user) => {
        const birthYear = new Date(user.birthday!).getFullYear();
        const age = currentYear - birthYear;
        return {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          birthday: user.birthday!,
          age,
        };
      });
  }

  async getFundReport() {
    const fund = await this.prisma.fund.findFirst();

    // Get current month's transactions
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyLogs = await this.prisma.fundContributionLog.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const monthIncome = monthlyLogs
      .filter((log) => log.type === 'INCOME')
      .reduce((sum, log) => sum + log.amount, 0);

    const monthExpense = monthlyLogs
      .filter((log) => log.type === 'EXPENSE')
      .reduce((sum, log) => sum + log.amount, 0);

    return {
      totalAmount: fund?.totalAmount ?? 0,
      currency: fund?.currency ?? 'idr',
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
    };
  }

  async getAnnouncementSettings() {
    const settings = await this.settingsService.getWhatsappSettings();
    const rawSettings = await this.prisma.settings.findUnique({
      where: { id: 1 },
    });

    return {
      announcementGroupJid: settings.announcementGroupJid ?? null,
      ENABLE_WHATSAPP_BOT_FUND_REPORT: settings.ENABLE_WHATSAPP_BOT_FUND_REPORT,
      ENABLE_WHATSAPP_BOT_DUTY_REPORT: settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT,
      ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER,
      ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER,
      ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER,
      dutyReminderTime: settings.dutyReminderTime,
      scheduleReminderTime: settings.scheduleReminderTime,
      assignmentReminderTime: settings.assignmentReminderTime,
      birthdayReminderTime: settings.birthdayReminderTime,
      fundReportDay: settings.fundReportDay,
      fundReportTime: settings.fundReportTime,
      dutyPersonalizedMessage: settings.dutyPersonalizedMessage,
      birthdayMessageTemplate: settings.birthdayMessageTemplate,
      timezone: settings.timezone,
      updatedAt: rawSettings?.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async isAdminByPhone(phoneNumber: string): Promise<boolean> {
    const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');

    console.log(phoneNumber)

    // Construct email from phone number: +{phone}@rotom.com
    const email = `+${normalizedPhone}@rotom.com`;

    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
      select: {
        role: true,
      },
    });

    return user?.role === ROLES.ADMIN;
  }

  async updateAnnouncementGroup(phoneNumber: string, groupJid: string): Promise<boolean> {
    // Verify the phone number belongs to an admin
    const isAdmin = await this.isAdminByPhone(phoneNumber);
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    // Update settings
    await this.settingsService.updateWhatsappSettings({
      announcementGroupJid: groupJid || null,
    });

    return true;
  }

  async getUserPhoneById(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    return user?.phoneNumber ?? null;
  }
}
