import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import * as moment from 'moment-timezone';
import { ApiService } from '../api/api.service';

interface LastTriggered {
  duty?: string;
  schedule?: string;
  assignment?: string;
  birthday?: string;
  fund?: string;
}

@Injectable()
export class AnnouncementsScheduler implements OnModuleInit {
  private readonly logger = new Logger(AnnouncementsScheduler.name);
  private lastCheckedMinute: number = -1;
  private lastSettingsUpdatedAt: string | null = null;
  private lastTriggered: LastTriggered = {};

  constructor(
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
    private readonly apiService: ApiService,
  ) {}

  onModuleInit() {
    // Start the scheduler loop
    this.logger.log('Starting announcements scheduler');
    this.scheduleLoop();
  }

  private async scheduleLoop() {
    // Run every minute
    setInterval(async () => {
      await this.checkAndScheduleJobs();
    }, 60000);

    // Initial check
    await this.checkAndScheduleJobs();
  }

  private getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number; day: number; time: string; date: string } {
    const tz = timezone === 'system' || !timezone ? moment.tz.guess() : timezone;
    const now = moment.tz(tz);

    return {
      hour: now.hours(),
      minute: now.minutes(),
      day: now.date(),
      time: now.format('HH:mm'),
      date: now.format('YYYY-MM-DD'),
    };
  }

  /**
   * Calculate time difference in minutes between two HH:MM times
   * Returns absolute difference (always positive)
   */
  private getTimeDiffInMinutes(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return Math.abs(minutes1 - minutes2);
  }

  /**
   * Check if a job should trigger now
   * - If exact match: trigger
   * - If within grace period (2 min) and settings just changed: trigger
   */
  private shouldTrigger(
    enabled: boolean,
    scheduledTime: string,
    currentTime: string,
    currentDate: string,
    lastTriggeredKey: keyof LastTriggered,
    settingsJustChanged: boolean,
  ): boolean {
    if (!enabled) return false;

    // Already triggered today
    if (this.lastTriggered[lastTriggeredKey] === currentDate) {
      return false;
    }

    // Exact match
    if (scheduledTime === currentTime) {
      return true;
    }

    // Grace period: if settings just changed, allow triggering within 2 minutes
    if (settingsJustChanged) {
      const diff = this.getTimeDiffInMinutes(scheduledTime, currentTime);
      if (diff <= 2) {
        this.logger.log(`Grace period trigger: ${lastTriggeredKey} (diff: ${diff} min)`);
        return true;
      }
    }

    return false;
  }

  private async checkAndScheduleJobs() {
    try {
      const settings = await this.apiService.getAnnouncementSettings();

      // Get current time in the configured timezone
      const { hour: currentHour, minute: currentMinute, day: currentDay, time: currentTime, date: currentDate } =
        this.getCurrentTimeInTimezone(settings.timezone);

      // Prevent duplicate checks within the same minute
      if (currentMinute === this.lastCheckedMinute) {
        return;
      }
      this.lastCheckedMinute = currentMinute;

      // Check if settings changed
      const settingsJustChanged = this.lastSettingsUpdatedAt !== null &&
        this.lastSettingsUpdatedAt !== settings.updatedAt;

      if (settingsJustChanged) {
        this.logger.log(`Settings changed (updatedAt: ${settings.updatedAt}), resetting last triggered times`);
        this.lastTriggered = {}; // Reset all last triggered times
      }
      this.lastSettingsUpdatedAt = settings.updatedAt;

      this.logger.log(`Checking schedules at ${currentTime} (timezone: ${settings.timezone || 'system'})${settingsJustChanged ? ' [settings changed]' : ''}`);

      // Check duty reminder time
      if (this.shouldTrigger(settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT, settings.dutyReminderTime, currentTime, currentDate, 'duty', settingsJustChanged)) {
        this.logger.log('Scheduling duty reminder job');
        await this.whatsappQueue.add('duty-reminder', {}, { attempts: 3, backoff: 60000 });
        this.lastTriggered.duty = currentDate;
      }

      // Check schedule reminder time
      if (this.shouldTrigger(settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER, settings.scheduleReminderTime, currentTime, currentDate, 'schedule', settingsJustChanged)) {
        this.logger.log('Scheduling schedule reminder job');
        await this.whatsappQueue.add('schedule-reminder', {}, { attempts: 3, backoff: 60000 });
        this.lastTriggered.schedule = currentDate;
      }

      // Check assignment reminder time
      if (this.shouldTrigger(settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER, settings.assignmentReminderTime, currentTime, currentDate, 'assignment', settingsJustChanged)) {
        this.logger.log('Scheduling assignment reminder job');
        await this.whatsappQueue.add('assignment-reminder', {}, { attempts: 3, backoff: 60000 });
        this.lastTriggered.assignment = currentDate;
      }

      // Check birthday reminder time
      if (this.shouldTrigger(settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER, settings.birthdayReminderTime, currentTime, currentDate, 'birthday', settingsJustChanged)) {
        this.logger.log('Scheduling birthday check job');
        await this.whatsappQueue.add('birthday-check', {}, { attempts: 3, backoff: 60000 });
        this.lastTriggered.birthday = currentDate;
      }

      // Check fund report (specific day and time)
      if (settings.ENABLE_WHATSAPP_BOT_FUND_REPORT && settings.fundReportDay === currentDay) {
        if (this.shouldTrigger(true, settings.fundReportTime, currentTime, currentDate, 'fund', settingsJustChanged)) {
          this.logger.log('Scheduling fund report job');
          await this.whatsappQueue.add('fund-report', {}, { attempts: 3, backoff: 60000 });
          this.lastTriggered.fund = currentDate;
        }
      }
    } catch (error) {
      this.logger.error('Error in scheduler check:', error);
    }
  }
}
