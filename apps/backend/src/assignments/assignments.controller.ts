import { Controller } from '@nestjs/common';
import { Implement, implement, ORPCError } from '@orpc/nest';
import { contract } from 'src/contract';
import { AssignmentsService } from './assignments.service';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';

@Controller()
export class AssignmentsController {
  constructor(public readonly assignmentsService: AssignmentsService) {}

  @Implement(contract.assignments.markAssignment)
  markAssignment() {
    return implement(contract.assignments.markAssignment)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.assignmentsService.markAssignment({
          assignmentId: input.id,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.assignments.unmarkAssignment)
  unmarkAssignment() {
    return implement(contract.assignments.unmarkAssignment)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.assignmentsService.unmarkAssignment({
          assignmentId: input.id,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.assignments.createAssignment)
  createAssignment() {
    return implement(contract.assignments.createAssignment)
      .use(role([ROLES.MENTOR, ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        await this.assignmentsService.createAssignment({
          ...input,
          creatorId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.assignments.deleteAssignment)
  deleteAssignment() {
    return implement(contract.assignments.deleteAssignment)
      .use(role([ROLES.MENTOR, ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        const assignment = await this.assignmentsService.getAssignmentById(
          input.id,
        );

        const isAssignmentCreator =
          assignment?.createdBy === context.session?.user.id;
        const isAdmin = context.session?.user.role === ROLES.ADMIN;

        if (!isAssignmentCreator && !isAdmin)
          throw new ORPCError('UNAUTHORIZED');

        await this.assignmentsService.deleteAssignmentById(input.id);
      });
  }

  @Implement(contract.assignments.updateAssignment)
  updateAssignment() {
    return implement(contract.assignments.updateAssignment)
      .use(role([ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        const assignment = await this.assignmentsService.getAssignmentById(
          input.id,
        );

        const isAssignmentCreator =
          assignment?.createdBy === context.session?.user.id;
        const isAdmin = context.session?.user.role === ROLES.ADMIN;

        if (!isAssignmentCreator && !isAdmin)
          throw new ORPCError('UNAUTHORIZED');

        await this.assignmentsService.updateAssignmentById(input);
      });
  }

  @Implement(contract.assignments.getAllAssignments)
  getAllAssignments() {
    return implement(contract.assignments.getAllAssignments)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input, context }) => {
        const assignments = await this.assignmentsService.getAllAssignments({
          ...input,
          userId: context.session?.user.id ?? '',
        });

        return assignments;
      });
  }
}
