import { z } from "zod";
import { User } from "@prisma/client";

// ✅ ENV SCHEMA
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  SECRET_KEY: z.string(),
  ACCESS_TOKEN: z.string(),
  REFRESH_TOKEN: z.string(),
  AUTH_EMAIL: z.string().email().optional(), // optional if not always set
  EMAIL_PASS: z.string().optional(),
  AUTH_GENERATED_PASS: z.string().optional(),
});

// ✅ Inferred TypeScript type from ENV schema
export type EnvSchema = z.infer<typeof envSchema>;
