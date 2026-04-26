import { Module } from '@nestjs/common';
import { DutiesController } from './duties.controller';
import { DutiesService } from './duties.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [DutiesController],
  providers: [DutiesService],
  imports: [PrismaModule, NotificationsModule],
})
export class DutiesModule {}
