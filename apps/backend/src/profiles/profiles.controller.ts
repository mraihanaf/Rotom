import { Controller } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { implement, Implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { role } from 'src/common/middleware/role';
import { ROLES } from 'src/common/enum';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Implement(contract.profiles.getMe)
  getMe() {
    return implement(contract.profiles.getMe)
      .use(protectedRoute)
      .handler(async ({ context }) => {
        const user = context.session!.user;
        const nameRequestStatus = await this.profilesService.getNameRequestStatus(user.id);
        return {
          id: user.id,
          createdAt: user.createdAt.toISOString(),
          image: user.image ?? '',
          name: user.name,
          phoneNumber: user.phoneNumber ?? '',
          birthday: user.birthday ? user.birthday.toISOString() : null,
          role: user.role ?? '',
          isProfileComplete: user.isProfileComplete,
          nameRequestStatus,
        };
      });
  }

  @Implement(contract.profiles.completeProfile)
  completeProfile() {
    return implement(contract.profiles.completeProfile)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        const result = await this.profilesService.completeProfile(
          context.session!.user.id,
          input,
        );
        return result;
      });
  }

  @Implement(contract.profiles.updateProfile)
  updateProfile() {
    return implement(contract.profiles.updateProfile)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        const result = await this.profilesService.updateProfile(
          context.session!.user.id,
          input,
        );
        const nameRequestStatus = await this.profilesService.getNameRequestStatus(result.id);
        return {
          id: result.id,
          createdAt: result.createdAt.toISOString(),
          image: result.image ?? '',
          name: result.name,
          phoneNumber: result.phoneNumber ?? '',
          birthday: result.birthday ? result.birthday.toISOString() : null,
          role: result.role ?? '',
          isProfileComplete: result.isProfileComplete,
          nameRequestStatus,
        };
      });
  }

  @Implement(contract.profiles.updateProfileImage)
  updateProfileImage() {
    return implement(contract.profiles.updateProfileImage)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        const updatedUser = await this.profilesService.updateProfileImage(
          context.session!.user.id,
          input.file,
        );
        const nameRequestStatus = await this.profilesService.getNameRequestStatus(updatedUser.id);
        return {
          id: updatedUser.id,
          createdAt: updatedUser.createdAt.toISOString(),
          image: updatedUser.image ?? '',
          name: updatedUser.name,
          phoneNumber: updatedUser.phoneNumber ?? '',
          birthday: updatedUser.birthday ? updatedUser.birthday.toISOString() : null,
          role: updatedUser.role ?? '',
          isProfileComplete: updatedUser.isProfileComplete,
          nameRequestStatus,
        };
      });
  }

  // Admin name change request endpoints
  @Implement(contract.profiles.getPendingNameChangeRequests)
  getPendingNameChangeRequests() {
    return implement(contract.profiles.getPendingNameChangeRequests)
      .use(role([ROLES.ADMIN]))
      .handler(async () => {
        const requests = await this.profilesService.getPendingNameChangeRequests();
        return requests.map(req => ({
          id: req.id,
          userId: req.userId,
          requestedName: req.requestedName,
          status: req.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          source: req.source as 'COMPLETE_PROFILE' | 'PROFILE_EDIT',
          requestedAt: req.requestedAt.toISOString(),
          reviewedAt: req.reviewedAt?.toISOString() ?? null,
          reviewedById: req.reviewedById,
          rejectionReason: req.rejectionReason,
          user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            image: req.user.image ?? null,
            phoneNumber: req.user.phoneNumber ?? null,
          },
        }));
      });
  }

  @Implement(contract.profiles.approveNameChangeRequest)
  approveNameChangeRequest() {
    return implement(contract.profiles.approveNameChangeRequest)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input, context }) => {
        const adminUserId = context.session!.user.id;
        const result = await this.profilesService.approveNameChangeRequest(
          input.requestId,
          adminUserId,
        );
        return {
          request: {
            id: result.request.id,
            userId: result.request.userId,
            requestedName: result.request.requestedName,
            status: result.request.status as 'PENDING' | 'APPROVED' | 'REJECTED',
            source: result.request.source as 'COMPLETE_PROFILE' | 'PROFILE_EDIT',
            requestedAt: result.request.requestedAt.toISOString(),
            reviewedAt: result.request.reviewedAt?.toISOString() ?? null,
            reviewedById: result.request.reviewedById,
            rejectionReason: result.request.rejectionReason,
            user: {
              id: result.request.user.id,
              name: result.request.user.name,
              email: result.request.user.email,
              image: result.request.user.image ?? null,
              phoneNumber: result.request.user.phoneNumber ?? null,
            },
          },
          previousName: result.previousName,
          newName: result.newName,
        };
      });
  }

  @Implement(contract.profiles.rejectNameChangeRequest)
  rejectNameChangeRequest() {
    return implement(contract.profiles.rejectNameChangeRequest)
      .use(role([ROLES.ADMIN]))
      .handler(async ({ input, context }) => {
        const adminUserId = context.session!.user.id;
        const result = await this.profilesService.rejectNameChangeRequest(
          input.requestId,
          adminUserId,
          input.reason,
        );
        return {
          id: result.id,
          userId: result.userId,
          requestedName: result.requestedName,
          status: result.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          source: result.source as 'COMPLETE_PROFILE' | 'PROFILE_EDIT',
          requestedAt: result.requestedAt.toISOString(),
          reviewedAt: result.reviewedAt?.toISOString() ?? null,
          reviewedById: result.reviewedById,
          rejectionReason: result.rejectionReason,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            image: result.user.image ?? null,
            phoneNumber: result.user.phoneNumber ?? null,
          },
        };
      });
  }
}
