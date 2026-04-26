import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaileysService } from '../baileys/baileys.service';

type NameChangeNotificationJob = {
  requestId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedName: string;
  requestedAt: string;
  adminPhoneNumbers: string[];
};

@Processor('notifications', {
  concurrency: 1,
})
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly baileysService: BaileysService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing notification job: ${job.name}`, job.data);

    // Ensure socket is ready
    const sock = this.baileysService.sock;
    if (!sock) {
      this.logger.warn('WhatsApp socket not ready, throwing error for retry');
      throw new Error('WhatsApp socket not ready');
    }

    switch (job.name) {
      case 'name-change-request.created': {
        await this.sendNameChangeNotification(job.data as NameChangeNotificationJob);
        break;
      }

      default:
        this.logger.warn(`Unknown notification job type: ${job.name}`);
    }
  }

  private async sendNameChangeNotification(notification: NameChangeNotificationJob): Promise<void> {
    const message = this.formatNameChangeNotification(notification);

    for (const phoneNumber of notification.adminPhoneNumbers) {
      const normalizedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      const jid = `${normalizedPhoneNumber}@s.whatsapp.net`;
      try {
        await this.baileysService.sock.sendMessage(jid, {
          text: message,
        });
        this.logger.debug(`Sent name change notification to admin ${normalizedPhoneNumber}`);
      } catch (err) {
        this.logger.warn(`Failed to send notification to admin ${normalizedPhoneNumber}:`, err);
      }
    }

    this.logger.log(`Processed name change notification job for request ${notification.requestId}`);
  }

  private formatNameChangeNotification(notification: NameChangeNotificationJob): string {
    const date = new Date(notification.requestedAt);
    const formattedDate = date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `🔔 *Permintaan Perubahan Nama*\n\n` +
      `Pengguna: *${notification.userName}*\n` +
      `Email: ${notification.userEmail}\n` +
      `Nama yang diminta: *${notification.requestedName}*\n` +
      `Waktu permintaan: ${formattedDate}\n\n` +
      `Silakan review dan approve/reject melalui aplikasi admin.`;
  }
}
