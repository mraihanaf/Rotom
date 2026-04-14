import z from 'zod';

export const OrganizationSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.iso.datetime().or(z.date()),
  updatedAt: z.iso.datetime().or(z.date()),
});

export const getOrganizationSchema = OrganizationSchema;

export const updateOrganizationInputSchema = z.object({
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const updateOrganizationLogoInputSchema = z.file();
