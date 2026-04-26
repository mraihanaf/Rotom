import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BaileysModule } from './baileys/baileys.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    BaileysModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
    }),

    AnnouncementsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
