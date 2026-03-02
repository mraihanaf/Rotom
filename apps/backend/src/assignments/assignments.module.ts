import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { SubjectsService } from 'src/subjects/subjects.service';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService, SubjectsService],
  imports: [PrismaModule, SubjectsModule],
})
export class AssignmentsModule {}
