import { Controller } from '@nestjs/common';
import { implement, Implement } from '@orpc/nest';
import { role } from 'src/common/middleware/role';
import { contract } from 'src/contract';
import { FundsService } from './funds.service';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { ROLES } from 'src/common/enum';

@Controller()
export class FundsController {
  constructor(public readonly fundsService: FundsService) {}

  @Implement(contract.funds.getFund)
  getFund() {
    return implement(contract.funds.getFund)
      .use(protectedRoute)
      .handler(async () => {
        const { totalAmount, currency } = await this.fundsService.getFund();
        return {
          totalAmount,
          currency,
        };
      });
  }

  @Implement(contract.funds.createContribution)
  createContribution() {
    return implement(contract.funds.createContribution)
      .use(role([ROLES.MAINTAINER, ROLES.ADMIN]))
      .handler(async ({ input, context }) => {
        await this.fundsService.createContribution({
          userContributorId: input.userContributorId,
          userReporterId: context.session?.user.id ?? '',
          amount: input.amount,
          note: input.note,
        });
      });
  }

  @Implement(contract.funds.deleteContributionById)
  deleteContributionById() {
    return implement(contract.funds.deleteContributionById)
      .use(role([ROLES.MAINTAINER, ROLES.ADMIN]))
      .handler(async ({ input }) => {
        await this.fundsService.deleteContributionById(input.id);
      });
  }

  @Implement(contract.funds.getAllContributions)
  getContributions() {
    return implement(contract.funds.getAllContributions)
      .use(protectedRoute)
      .handler(async ({ input }) => {
        const contributions =
          await this.fundsService.getAllContributions(input);
        return contributions;
      });
  }
}
