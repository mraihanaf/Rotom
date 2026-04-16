import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsCompletionController } from './assignments-completion.controller';
import { AssignmentsCompletionService } from './assignments-completion.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { SubjectsService } from 'src/subjects/subjects.service';

@Module({
  controllers: [AssignmentsController, AssignmentsCompletionController],
  providers: [AssignmentsService, AssignmentsCompletionService, SubjectsService],
  imports: [PrismaModule, SubjectsModule],
})
export class AssignmentsModule {}
