import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';
import { BaileysModule } from '../baileys/baileys.module';

@Module({
  imports: [
    BaileysModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsProcessor],
  exports: [NotificationsProcessor],
})
export class NotificationsModule {}
