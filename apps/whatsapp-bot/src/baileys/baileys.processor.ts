import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaileysService } from './baileys.service';
import { sendOtpSchema } from './baileys.schema';

@Processor('whatsapp')
export class BaileysProcessor extends WorkerHost {
  constructor(private readonly baileysService: BaileysService) {
    super();
  }

  private readonly logger = new Logger(BaileysProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.debug(job.data);

    switch (job.name) {
      case 'send-otp': {
        const parsed = sendOtpSchema.safeParse(job.data);
        if (!parsed.success) {
          this.logger.warn('send-otp job data invalid', parsed.error.flatten());
          return job.remove();
        }
        const data = parsed.data;
        const sock = this.baileysService.sock;
        if (!sock) {
          this.logger.warn('WhatsApp socket not ready yet, skipping send-otp');
          throw new Error('WhatsApp socket not ready'); // BullMQ will retry
        }
        const jid = data.phoneNumber + '@s.whatsapp.net';
        this.logger.debug(`Sending OTP to ${data.phoneNumber} -> ${jid}`);
        await sock.sendMessage(jid, {
          text: `Your OTP is *${data.code}*`,
        });
        this.logger.debug('success!');
        break;
      }
      case 'send-message': {
        this.logger.debug('Sending Message');
        break;
      }
    }
  }
}
