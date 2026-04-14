import { ORPCGlobalContext } from '@orpc/nest';
import { ORPCError, os } from '@orpc/server';
import { getAuthInstance } from 'src/auth/auth';

export const protectedRoute = os
  .$context<ORPCGlobalContext>()
  .middleware(async ({ context, next }) => {
    const session = await getAuthInstance().api.getSession({
      headers: context.request.headers,
    });
    if (!session) throw new ORPCError('UNAUTHORIZED');
    context.session = session;
    return next();
  });
