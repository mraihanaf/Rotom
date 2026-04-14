import { ORPCGlobalContext } from '@orpc/nest';
import { os as baseOs, ORPCError } from '@orpc/server';
import { getAuthInstance } from 'src/auth/auth';

const os = baseOs.$context<ORPCGlobalContext>();

export function role(allowedRoles: string[]) {
  return os.middleware(async ({ context, next }) => {
    const session = await getAuthInstance().api.getSession({
      headers: context.request.headers,
    });
    if (!session) throw new ORPCError('UNAUTHORIZED');
    context.session = session;

    const userRole = context.session.user.role!;

    if (!allowedRoles.includes(userRole)) {
      throw new ORPCError('FORBIDDEN', {
        message: `Required roles [${allowedRoles.join(', ')}], but user has role '${userRole}'`,
      });
    }

    return next(); // This should work now!
  });
}
