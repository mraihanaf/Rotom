import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface DutyPerson {
  id: string;
  name: string;
  phoneNumber: string | null;
  dutyType: {
    id: string;
    name: string;
    category: string;
  };
}

interface ScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  subject: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

interface BirthdayPerson {
  id: string;
  name: string;
  phoneNumber: string | null;
  birthday: string;
  age?: number;
}

interface FundReport {
  totalAmount: number;
  currency: string;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
}

interface AnnouncementSettings {
  announcementGroupJid: string | null;
  ENABLE_WHATSAPP_BOT_FUND_REPORT: boolean;
  ENABLE_WHATSAPP_BOT_DUTY_REPORT: boolean;
  ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER: boolean;
  ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER: boolean;
  ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER: boolean;
  dutyReminderLeadTime: string;
  dutyReminderLeadDays: number;
  scheduleReminderLeadTime: string;
  scheduleReminderLeadDays: number;
  assignmentReminderLeadTime: string;
  assignmentReminderLeadDays: number;
  birthdayReminderTime: string;
  fundReportDay: number;
  fundReportTime: string;
  dutyPersonalizedMessage: string;
  birthdayMessageTemplate: string;
  timezone: string;
  updatedAt: string;
}

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  private readonly baseUrl: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('BACKEND_API_URL') || 'http://localhost:3000';
    this.apiSecret = this.configService.get<string>('BOT_API_SECRET') || '';
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiSecret && { 'X-Bot-Secret': this.apiSecret }),
      ...((options?.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      this.logger.error(`Failed to fetch ${path}:`, error);
      throw error;
    }
  }

  async isAdminByPhone(phoneNumber: string): Promise<boolean> {
    try {
      const result = await this.fetch<{ isAdmin: boolean }>(
        `/announcements/check-admin?phoneNumber=${encodeURIComponent(phoneNumber)}`
      );
      return result.isAdmin;
    } catch {
      return false;
    }
  }

  async getAnnouncementSettings(): Promise<AnnouncementSettings> {
    return this.fetch<AnnouncementSettings>('/announcements/settings');
  }

  async getTodayDuties(): Promise<DutyPerson[]> {
    return this.fetch<DutyPerson[]>('/announcements/duties/today');
  }

  async getDutiesByDate(date: string): Promise<DutyPerson[]> {
    return this.fetch<DutyPerson[]>(`/announcements/duties/by-date?date=${encodeURIComponent(date)}`);
  }

  async getTodaySchedule(): Promise<ScheduleItem[]> {
    return this.fetch<ScheduleItem[]>('/announcements/schedule/today');
  }

  async getPendingAssignments(date?: string): Promise<Assignment[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.fetch<Assignment[]>(`/announcements/assignments/pending${query}`);
  }

  async getTodayBirthdays(): Promise<BirthdayPerson[]> {
    return this.fetch<BirthdayPerson[]>('/announcements/birthdays/today');
  }

  async getFundReport(): Promise<FundReport> {
    return this.fetch<FundReport>('/announcements/fund-report');
  }

  async updateAnnouncementGroupJid(phoneNumber: string, groupJid: string): Promise<void> {
    await this.fetch('/announcements/group', {
      method: 'PUT',
      body: JSON.stringify({ phoneNumber, groupJid }),
    });
  }

  async getScheduleByDate(date: string): Promise<ScheduleItem[]> {
    return this.fetch<ScheduleItem[]>(`/announcements/schedule/by-date?date=${encodeURIComponent(date)}`);
  }
}
