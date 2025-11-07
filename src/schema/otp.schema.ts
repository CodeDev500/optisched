import { z } from "zod";

export const otpSchema = z.object({
  id: z.number().int().optional(),
  otp: z.string(),
  email: z.string().email(),
  createdAt: z.date().optional(),
  expiresAt: z.date(),
});

export type Otp = z.infer<typeof otpSchema>;
