import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
  imports: [PrismaModule, NotificationsModule],
})
export class SchedulesModule {}
