import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as moment from 'moment-timezone';
import { ApiService } from '../api/api.service';

export type ReminderType =
  | 'duty'
  | 'schedule'
  | 'assignment'
  | 'birthday'
  | 'fund';

interface ScheduledJob {
  type: ReminderType;
  name:
    | 'duty-reminder'
    | 'schedule-reminder'
    | 'assignment-reminder'
    | 'birthday-check'
    | 'fund-report';
  jobId: string;
  delay: number;
  data?: Record<string, unknown>;
}

@Injectable()
export class AnnouncementsScheduler implements OnModuleInit {
  private readonly logger = new Logger(AnnouncementsScheduler.name);

  constructor(
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
    @InjectQueue('whatsapp-control') private readonly controlQueue: Queue,
    private readonly apiService: ApiService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting event-driven announcements planner');
    await this.enqueueReconcile('startup');
  }

  /**
   * Reschedule all reminder jobs based on current settings
   */
  async handleControlJob(
    name: 'scheduler.reconcile' | 'scheduler.resync.all' | 'scheduler.plan-next',
    data?: Record<string, unknown>,
  ) {
    if (name === 'scheduler.plan-next') {
      const kind = data?.kind;
      if (typeof kind === 'string') {
        await this.scheduleNextOccurrence(kind as ReminderType);
      }
      return;
    }

    await this.rescheduleAllJobs();
  }

  async enqueueReconcile(reason: string) {
    await this.upsertControlJob('scheduler.reconcile', { reason }, 'scheduler.reconcile');
  }

  async enqueuePlanNext(kind: ReminderType, reason: string) {
    await this.upsertControlJob(
      'scheduler.plan-next',
      { kind, reason },
      `scheduler-plan-next-${kind}`,
    );
  }

  private async rescheduleAllJobs() {
    this.logger.log('Reconciling reminder jobs from current settings');

    const settings = await this.apiService.getAnnouncementSettings();
    await this.clearExecutionJobs();

    const jobs: ScheduledJob[] = [];

    if (settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT) {
      const job = this.calculateLeadReminderJob(
        'duty',
        settings.dutyReminderLeadTime,
        settings.timezone,
        settings.dutyReminderLeadDays ?? 0,
      );
      if (job) jobs.push(job);
    }

    if (settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER) {
      const job = this.calculateLeadReminderJob(
        'schedule',
        settings.scheduleReminderLeadTime,
        settings.timezone,
        settings.scheduleReminderLeadDays ?? 0,
      );
      if (job) jobs.push(job);
    }

    if (settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER) {
      const job = this.calculateLeadReminderJob(
        'assignment',
        settings.assignmentReminderLeadTime,
        settings.timezone,
        settings.assignmentReminderLeadDays ?? 0,
      );
      if (job) jobs.push(job);
    }

    if (settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER) {
      const job = this.calculateDailyJob('birthday', settings.birthdayReminderTime, settings.timezone);
      if (job) jobs.push(job);
    }

    if (settings.ENABLE_WHATSAPP_BOT_FUND_REPORT) {
      const job = this.calculateFundReportJob(
        settings.fundReportDay,
        settings.fundReportTime,
        settings.timezone,
      );
      if (job) jobs.push(job);
    }

    for (const job of jobs) {
      await this.scheduleExecutionJob(job);
    }

    this.logger.log(`Reconciled ${jobs.length} exact delayed reminder job(s)`);
  }

  /**
   * Clear existing scheduled jobs
   */
  private async clearExecutionJobs() {
    const executionNames = new Set([
      'duty-reminder',
      'schedule-reminder',
      'assignment-reminder',
      'birthday-check',
      'fund-report',
    ]);

    const jobs = await this.whatsappQueue.getJobs(['waiting', 'delayed', 'prioritized']);
    for (const job of jobs) {
      if (executionNames.has(job.name)) {
        await job.remove();
      }
    }
  }

  /**
   * Calculate the next occurrence of a daily job
   */
  private calculateDailyJob(
    type: Extract<ReminderType, 'birthday'>,
    timeStr: string,
    timezone: string,
  ): ScheduledJob | null {
    const tz = timezone === 'system' || !timezone ? moment.tz.guess() : timezone;
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Calculate next occurrence
    const now = moment.tz(tz);
    let next = moment.tz(tz).hours(hours).minutes(minutes).seconds(0).milliseconds(0);

    // If the time has already passed today, schedule for tomorrow
    if (next.isSameOrBefore(now)) {
      next = next.add(1, 'day');
    }

    const delay = next.diff(now);
    const date = next.format('YYYY-MM-DD');
    const nameMap = {
      birthday: 'birthday-check',
    } as const;

    return {
      type,
      name: nameMap[type],
      jobId: `${type}-${date}`,
      delay,
      data: { targetDate: date },
    };
  }

  /**
   * Calculate lead-time job for schedule reminders
   */
  private calculateLeadReminderJob(
    type: Extract<ReminderType, 'duty' | 'schedule' | 'assignment'>,
    timeStr: string,
    timezone: string,
    leadDays: number,
  ): ScheduledJob | null {
    const tz = timezone === 'system' || !timezone ? moment.tz.guess() : timezone;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = moment.tz(tz);
    let executeAt = moment.tz(tz)
      .hours(hours).minutes(minutes).seconds(0).milliseconds(0);

    if (executeAt.isSameOrBefore(now)) {
      executeAt = executeAt.add(1, 'day');
    }

    const delay = executeAt.diff(now);
    const date = executeAt.clone().add(leadDays, 'days').format('YYYY-MM-DD');
    const nameMap = {
      duty: 'duty-reminder',
      schedule: 'schedule-reminder',
      assignment: 'assignment-reminder',
    } as const;

    return {
      type,
      name: nameMap[type],
      jobId: `${type}-${date}`,
      delay,
      data: { targetDate: date },
    };
  }

  /**
   * Calculate fund report job for the specific day of month
   */
  private calculateFundReportJob(
    dayOfMonth: number,
    timeStr: string,
    timezone: string,
  ): ScheduledJob | null {
    const tz = timezone === 'system' || !timezone ? moment.tz.guess() : timezone;
    const [hours, minutes] = timeStr.split(':').map(Number);

    const now = moment.tz(tz);
    let target = moment.tz(tz).date(dayOfMonth).hours(hours).minutes(minutes).seconds(0).milliseconds(0);

    // If the target date has passed this month, schedule for next month
    if (target.isSameOrBefore(now)) {
      target = target.add(1, 'month');
    }

    const delay = target.diff(now);
    const date = target.format('YYYY-MM-DD');

    return {
      type: 'fund',
      name: 'fund-report',
      jobId: `fund-${date}`,
      delay,
      data: { targetDate: date },
    };
  }

  /**
   * Schedule a job with BullMQ
   */
  private async scheduleExecutionJob(job: ScheduledJob) {
    try {
      const existingJob = await this.whatsappQueue.getJob(job.jobId);
      if (existingJob) {
        const scheduledAt = existingJob.timestamp + (existingJob.delay ?? 0);
        if (scheduledAt > Date.now()) {
          this.logger.debug(`Job ${job.jobId} already exists, skipping`);
          return;
        }

        this.logger.debug(`Job ${job.jobId} exists but is stale, removing before reapplying`);
        await existingJob.remove();
      }

      await this.whatsappQueue.add(
        job.name,
        job.data || {},
        {
          jobId: job.jobId,
          delay: job.delay,
          attempts: 3,
          backoff: 60000,
        },
      );

      const executeAt = new Date(Date.now() + job.delay);
      this.logger.log(`Scheduled ${job.type} job (${job.jobId}) to execute at ${executeAt.toISOString()}`);
    } catch (error) {
      this.logger.error(`Failed to schedule ${job.type} job:`, error);
    }
  }

  private async upsertControlJob(
    name: 'scheduler.reconcile' | 'scheduler.resync.all' | 'scheduler.plan-next',
    data: Record<string, unknown>,
    jobId: string,
  ) {
    const existingJob = await this.controlQueue.getJob(jobId);
    if (existingJob) {
      this.logger.debug(`Control job ${jobId} already queued, skipping`);
      return;
    }

    await this.controlQueue.add(name, data, {
      jobId,
      attempts: 3,
      backoff: 60000,
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }

  private async scheduleNextOccurrence(type: ReminderType) {
    const settings = await this.apiService.getAnnouncementSettings();
    let job: ScheduledJob | null = null;

    switch (type) {
      case 'duty':
        if (settings.ENABLE_WHATSAPP_BOT_DUTY_REPORT) {
          job = this.calculateLeadReminderJob(
            'duty',
            settings.dutyReminderLeadTime,
            settings.timezone,
            settings.dutyReminderLeadDays ?? 0,
          );
        }
        break;
      case 'schedule':
        if (settings.ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER) {
          job = this.calculateLeadReminderJob(
            'schedule',
            settings.scheduleReminderLeadTime,
            settings.timezone,
            settings.scheduleReminderLeadDays ?? 0,
          );
        }
        break;
      case 'assignment':
        if (settings.ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER) {
          job = this.calculateLeadReminderJob(
            'assignment',
            settings.assignmentReminderLeadTime,
            settings.timezone,
            settings.assignmentReminderLeadDays ?? 0,
          );
        }
        break;
      case 'birthday':
        if (settings.ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER) {
          job = this.calculateDailyJob('birthday', settings.birthdayReminderTime, settings.timezone);
        }
        break;
      case 'fund':
        if (settings.ENABLE_WHATSAPP_BOT_FUND_REPORT) {
          job = this.calculateFundReportJob(
            settings.fundReportDay,
            settings.fundReportTime,
            settings.timezone,
          );
        }
        break;
    }

    if (job) {
      await this.scheduleExecutionJob(job);
    }
  }
}
