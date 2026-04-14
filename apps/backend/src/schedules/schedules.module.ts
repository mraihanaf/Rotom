import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
  imports: [PrismaModule],
})
export class SchedulesModule {}
