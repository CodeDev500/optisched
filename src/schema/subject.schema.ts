import { z } from "zod";

export const subjectSchema = z.object({
  id: z.number().int().optional(),
  subjectCode: z.string(),
  subjectDescription: z.string(),
  lec: z.number().int().default(0),
  lab: z.number().int().default(0),
  units: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Subject = z.infer<typeof subjectSchema>;
