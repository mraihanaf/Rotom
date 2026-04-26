import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

type SchedulerControlJobName = 'scheduler.reconcile' | 'scheduler.resync.all';

type NameChangeNotificationPayload = {
  requestId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedName: string;
  requestedAt: string;
  adminPhoneNumbers: string[];
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('whatsapp-control')
    private readonly whatsappControlQueue: Queue,
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  async publishSchedulerReconcile(reason: string) {
    await this.publishControlJob('scheduler.reconcile', { reason }, 'scheduler.reconcile');
  }

  async publishSchedulerResyncAll(reason: string) {
    await this.publishControlJob('scheduler.resync.all', { reason }, 'scheduler.resync.all');
  }

  async publishNameChangeRequestCreated(payload: NameChangeNotificationPayload) {
    if (payload.adminPhoneNumbers.length === 0) {
      this.logger.warn(
        `Skipping name change notification for request ${payload.requestId} because no admin phone numbers are available`,
      );
      return;
    }

    const jobId = `name-change-request-${payload.requestId}`;

    const existingJob = await this.notificationsQueue.getJob(jobId);
    if (existingJob) {
      this.logger.debug(
        `Name change notification job already exists for request ${payload.requestId}`,
      );
      return;
    }

    await this.notificationsQueue.add('name-change-request.created', payload, {
      jobId,
      attempts: 3,
      backoff: 60000,
      removeOnComplete: true,
      removeOnFail: 100,
    });

    this.logger.log(`Published name change notification job for request ${payload.requestId}`);
  }

  private async publishControlJob(
    name: SchedulerControlJobName,
    data: Record<string, string>,
    jobId: string,
  ) {
    const existingJob = await this.whatsappControlQueue.getJob(jobId);
    if (existingJob) {
      this.logger.debug(`Control job ${jobId} already exists, skipping publish`);
      return;
    }

    await this.whatsappControlQueue.add(name, data, {
      jobId,
      attempts: 3,
      backoff: 60000,
      removeOnComplete: true,
      removeOnFail: 100,
    });

    this.logger.log(`Published control job ${name}`);
  }
}
