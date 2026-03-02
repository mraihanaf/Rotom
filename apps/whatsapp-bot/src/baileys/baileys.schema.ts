import { z } from 'zod';

export const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\+/g, '')),
  code: z.string(),
});

export const sendGroupMessageSchema = z.object({
  message: z.string().min(1),
});
