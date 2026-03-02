import { Controller } from '@nestjs/common';
import { DutiesService } from './duties.service';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';
import { protectedRoute } from 'src/common/middleware/protectedRoute';

@Controller()
export class DutiesController {
  constructor(public readonly dutiesService: DutiesService) {}

  @Implement(contract.duty.createDuty)
  createDuty() {
    return implement(contract.duty.createDuty)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.dutiesService.createDuty(input);
      });
  }

  @Implement(contract.duty.updateDuty)
  updateDuty() {
    return implement(contract.duty.updateDuty)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.dutiesService.updateDuty(input);
      });
  }

  @Implement(contract.duty.deleteDutyById)
  deleteDutyById() {
    return implement(contract.duty.deleteDutyById)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.dutiesService.deleteDutyById(input.id);
      });
  }

  @Implement(contract.duty.getAllDuties)
  getAllDuties() {
    return implement(contract.duty.getAllDuties)
      .use(protectedRoute)
      .handler(async () => {
        const duties = await this.dutiesService.getAllDuties();
        return duties;
      });
  }
}
