import { Controller } from '@nestjs/common';
import { implement, Implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
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
}
