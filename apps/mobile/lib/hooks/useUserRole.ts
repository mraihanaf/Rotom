import { authClient } from '@/lib/auth-client';

export const ROLES = {
  ADMIN: 'admin',
  MAINTAINER: 'maintainer',
  MENTOR: 'mentor',
  USER: 'user',
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

const WRITE_PERMISSIONS: Record<string, Role[]> = {
  assignments: [ROLES.MENTOR, ROLES.ADMIN, ROLES.MAINTAINER],
  'assignments:update': [ROLES.ADMIN, ROLES.MAINTAINER],
  funds: [ROLES.MAINTAINER, ROLES.ADMIN],
  duties: [ROLES.ADMIN, ROLES.MAINTAINER], // Both can manage piket
  subjects: [ROLES.ADMIN],
  schedule: [ROLES.ADMIN, ROLES.MAINTAINER],
  gallery: [], // ownership check handled separately
};

export function useUserRole() {
  const { data: session } = authClient.useSession();

  const role = (session?.user?.role ?? ROLES.USER) as Role;

  const isAdmin = role === ROLES.ADMIN;
  const isMaintainer = role === ROLES.MAINTAINER;
  const isMentor = role === ROLES.MENTOR;
  const isUser = role === ROLES.USER;

  const canWrite = (resource: keyof typeof WRITE_PERMISSIONS): boolean => {
    const allowed = WRITE_PERMISSIONS[resource];
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(role);
  };

  const isOwner = (ownerId: string): boolean => {
    return session?.user?.id === ownerId;
  };

  return {
    role,
    userId: session?.user?.id ?? null,
    isAdmin,
    isMaintainer,
    isMentor,
    isUser,
    canWrite,
    isOwner,
  };
}
