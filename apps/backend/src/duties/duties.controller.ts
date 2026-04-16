import { Controller } from '@nestjs/common';
import { DutiesService } from './duties.service';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';

const ADMIN_AND_MAINTAINER = [ROLES.ADMIN, ROLES.MAINTAINER];

@Controller()
export class DutiesController {
  constructor(public readonly dutiesService: DutiesService) {}

  // Duty Type endpoints (Admin only)
  @Implement(contract.duty.createDutyType)
  createDutyType() {
    return implement(contract.duty.createDutyType)
      .use(role([ROLES.ADMIN]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.createDutyType(input);
      });
  }

  @Implement(contract.duty.updateDutyType)
  updateDutyType() {
    return implement(contract.duty.updateDutyType)
      .use(role([ROLES.ADMIN]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.updateDutyType(input);
      });
  }

  @Implement(contract.duty.deleteDutyType)
  deleteDutyType() {
    return implement(contract.duty.deleteDutyType)
      .use(role([ROLES.ADMIN]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        await this.dutiesService.deleteDutyType(input.id);
      });
  }

  @Implement(contract.duty.getAllDutyTypes)
  getAllDutyTypes() {
    return implement(contract.duty.getAllDutyTypes)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async () => {
        return await this.dutiesService.getAllDutyTypes();
      });
  }

  // Duty Schedule endpoints (Admin and Maintainer)
  @Implement(contract.duty.createDutySchedule)
  createDutySchedule() {
    return implement(contract.duty.createDutySchedule)
      .use(role(ADMIN_AND_MAINTAINER))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.createDutySchedule(input);
      });
  }

  @Implement(contract.duty.updateDutySchedule)
  updateDutySchedule() {
    return implement(contract.duty.updateDutySchedule)
      .use(role(ADMIN_AND_MAINTAINER))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.updateDutySchedule(input);
      });
  }

  @Implement(contract.duty.deleteDutySchedule)
  deleteDutySchedule() {
    return implement(contract.duty.deleteDutySchedule)
      .use(role(ADMIN_AND_MAINTAINER))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        await this.dutiesService.deleteDutySchedule(input.id);
      });
  }

  @Implement(contract.duty.updateDutyStatus)
  updateDutyStatus() {
    return implement(contract.duty.updateDutyStatus)
      .use(role(ADMIN_AND_MAINTAINER))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.updateDutyStatus(input);
      });
  }

  @Implement(contract.duty.getWeekDuties)
  getWeekDuties() {
    return implement(contract.duty.getWeekDuties)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return await this.dutiesService.getWeekDuties(input);
      });
  }
}
