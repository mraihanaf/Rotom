import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { DashboardService } from './dashboard.service';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { requireCompleteProfile } from 'src/common/middleware/requireCompleteProfile';

@Controller()
export class DashboardController {
  constructor(public readonly dashboardService: DashboardService) {}

  @Implement(contract.dashboard.getDashboardSummary)
  getDashboardSummary() {
    return implement(contract.dashboard.getDashboardSummary)
      .use(protectedRoute)
      .use(requireCompleteProfile)
      .handler(async ({ context }) => {
        const summary = await this.dashboardService.getSummary(
          context.session?.user.id ?? '',
        );
        return summary;
      });
  }
}
