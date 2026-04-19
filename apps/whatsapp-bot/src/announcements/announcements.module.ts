import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnnouncementsProcessor } from './announcements.processor';
import { AnnouncementsScheduler } from './announcements.scheduler';
import { ApiModule } from '../api/api.module';
import { BaileysModule } from '../baileys/baileys.module';

@Module({
  imports: [
    ApiModule,
    BaileysModule,
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
  ],
  providers: [AnnouncementsProcessor, AnnouncementsScheduler],
  exports: [AnnouncementsScheduler],
})
export class AnnouncementsModule {}
