import { Controller } from '@nestjs/common';
import { implement, Implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(public readonly usersService: UsersService) {}

  @Implement(contract.users.getAll)
  getAll() {
    return implement(contract.users.getAll)
      .use(protectedRoute)
      .handler(async ({ input }) => {
        return this.usersService.getAll(input);
      });
  }

  @Implement(contract.users.updateRole)
  updateRole() {
    return implement(contract.users.updateRole)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input, context }) => {
        const currentUserId = context.session?.user.id;
        const user = await this.usersService.updateUserRole(
          input.id,
          input.role,
          currentUserId!,
        );
        return { success: true, user };
      });
  }
}
