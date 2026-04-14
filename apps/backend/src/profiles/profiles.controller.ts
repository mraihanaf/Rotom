import { Controller } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { implement, Implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

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
          birthday: user.birthday,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
        };
      });
  }

  @Implement(contract.profiles.completeProfile)
  completeProfile() {
    return implement(contract.profiles.completeProfile)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        await this.profilesService.completeProfile(
          context.session!.user.id,
          input,
        );
      });
  }

  @Implement(contract.profiles.updateProfile)
  updateProfile() {
    return implement(contract.profiles.updateProfile)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        const updatedUser = await this.profilesService.updateProfile(
          context.session!.user.id,
          input,
        );
        return {
          id: updatedUser.id,
          createdAt: updatedUser.createdAt,
          image: updatedUser.image,
          name: updatedUser.name,
          phoneNumber: updatedUser.phoneNumber,
          birthday: updatedUser.birthday,
          role: updatedUser.role,
          isProfileComplete: updatedUser.isProfileComplete,
        };
      });
  }
}
