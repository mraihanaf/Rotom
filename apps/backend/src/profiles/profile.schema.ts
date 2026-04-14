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

export const completeProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.iso.datetime(),
});

export const updateProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.iso.datetime(),
});
