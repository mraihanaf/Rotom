import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';
import { SchedulesService } from './schedules.service';

@Controller()
export class SchedulesController {
  constructor(public readonly schedulesService: SchedulesService) {}

  @Implement(contract.schedules.getByDay)
  getByDay() {
    return implement(contract.schedules.getByDay)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return this.schedulesService.getByDay(input.dayOfWeek);
      });
  }

  @Implement(contract.schedules.getWeek)
  getWeek() {
    return implement(contract.schedules.getWeek)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async () => {
        return this.schedulesService.getWeek();
      });
  }

  @Implement(contract.schedules.create)
  create() {
    return implement(contract.schedules.create)
      .use(role([ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        return this.schedulesService.create(input);
      });
  }

  @Implement(contract.schedules.update)
  update() {
    return implement(contract.schedules.update)
      .use(role([ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        await this.schedulesService.update(input);
      });
  }

  @Implement(contract.schedules.deleteById)
  deleteById() {
    return implement(contract.schedules.deleteById)
      .use(role([ROLES.ADMIN, ROLES.MAINTAINER]))
      .use(requireCompleteProfile)
      .handler(async ({ input }) => {
        await this.schedulesService.deleteById(input.id);
      });
  }
}
