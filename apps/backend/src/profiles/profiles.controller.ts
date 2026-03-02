import { Controller } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { implement, Implement } from '@orpc/nest';
import { PrismaService } from 'src/prisma/prisma.service';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';

@Controller()
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private prismaService: PrismaService,
  ) {}

  @Implement(contract.profiles.getMe)
  getMe() {
    return implement(contract.profiles.getMe)
      .use(protectedRoute)
      .handler(({ context }) => {
        const user = context.session!.user;
        return {
          id: user.id,
          createdAt: user.createdAt,
          image: user.image,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
        };
      });
  }
}
