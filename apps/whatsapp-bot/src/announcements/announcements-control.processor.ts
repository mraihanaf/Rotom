import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AnnouncementsScheduler } from './announcements.scheduler';

@Processor('whatsapp-control', {
  concurrency: 1,
})
export class AnnouncementsControlProcessor extends WorkerHost {
  private readonly logger = new Logger(AnnouncementsControlProcessor.name);

  constructor(private readonly scheduler: AnnouncementsScheduler) {
    super();
  }

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.debug(`Processing control job: ${job.name}`, job.data);

    switch (job.name) {
      case 'scheduler.reconcile':
      case 'scheduler.resync.all':
      case 'scheduler.plan-next': {
        await this.scheduler.handleControlJob(
          job.name as 'scheduler.reconcile' | 'scheduler.resync.all' | 'scheduler.plan-next',
          job.data,
        );
        break;
      }

      default:
        this.logger.warn(`Unknown control job type: ${job.name}`);
    }
  }
}
