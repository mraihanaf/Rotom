import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { assignmentsCompletionContract } from './assignments-completion.contract';
import { AssignmentsCompletionService } from './assignments-completion.service';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';

@Controller()
export class AssignmentsCompletionController {
  constructor(
    public readonly assignmentsCompletionService: AssignmentsCompletionService,
  ) {}

  @Implement(assignmentsCompletionContract.getCompletionStats)
  getCompletionStats() {
    return implement(assignmentsCompletionContract.getCompletionStats)
      .use(role([ROLES.MENTOR, ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async () => {
        const stats = await this.assignmentsCompletionService.getCompletionStats();
        return stats;
      });
  }

  @Implement(assignmentsCompletionContract.getAssignmentCompletions)
  getAssignmentCompletions() {
    return implement(assignmentsCompletionContract.getAssignmentCompletions)
      .use(role([ROLES.MENTOR, ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        const completions =
          await this.assignmentsCompletionService.getAssignmentCompletions(
            input.id,
          );
        return completions;
      });
  }
}
