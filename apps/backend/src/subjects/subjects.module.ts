import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService],
  imports: [PrismaModule],
})
export class SubjectsModule {}
