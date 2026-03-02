import { z } from 'zod';

export const profileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    createdAt: z.date(),
  })
  .transform((profile) => ({
    id: profile.id,
    name: profile.name,
    role: profile.role ?? '',
    image: profile.image ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    createdAt: profile.createdAt.toISOString(),
  }));
