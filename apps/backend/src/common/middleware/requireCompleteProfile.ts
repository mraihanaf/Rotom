import { ORPCGlobalContext } from '@orpc/nest';
import { ORPCError, os } from '@orpc/server';

export const requireCompleteProfile = os
  .$context<ORPCGlobalContext>()
  .middleware(async ({ context, next }) => {
    if (!context.session?.user.isProfileComplete) {
      throw new ORPCError('FORBIDDEN', {
        message: 'PROFILE_INCOMPLETE',
      });
    }
    return next();
  });
