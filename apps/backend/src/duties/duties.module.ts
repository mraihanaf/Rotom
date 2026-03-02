import { Module } from '@nestjs/common';
import { DutiesController } from './duties.controller';
import { DutiesService } from './duties.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [DutiesController],
  providers: [DutiesService],
  imports: [PrismaModule],
})
export class DutiesModule {}
