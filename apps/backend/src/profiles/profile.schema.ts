import z from 'zod';

export const profileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    birthday: z.date().nullable().optional(),
    isProfileComplete: z.boolean(),
    createdAt: z.date(),
  })
  .transform((profile) => ({
    id: profile.id,
    name: profile.name,
    role: profile.role ?? '',
    image: profile.image ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    birthday: profile.birthday ? profile.birthday.toISOString() : null,
    isProfileComplete: profile.isProfileComplete,
    createdAt: profile.createdAt.toISOString(),
  }));

export const profileWithNameRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  image: z.string(),
  phoneNumber: z.string(),
  birthday: z.string().nullable(),
  isProfileComplete: z.boolean(),
  createdAt: z.string(),
  nameRequestStatus: z.object({
    hasPendingRequest: z.boolean(),
    pendingRequestedName: z.string().nullable(),
    pendingRequestId: z.string().nullable(),
  }),
});

export const completeProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.iso.datetime(),
});

export const updateProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.iso.datetime(),
});

// Admin name change request schemas
export const nameChangeRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requestedName: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  source: z.enum(['COMPLETE_PROFILE', 'PROFILE_EDIT']),
  requestedAt: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedById: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export const approveNameChangeInputSchema = z.object({
  requestId: z.string(),
});

export const rejectNameChangeInputSchema = z.object({
  requestId: z.string(),
  reason: z.string().optional(),
});

export const nameChangeRequestListSchema = z.array(nameChangeRequestSchema);
