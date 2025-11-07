import { z } from "zod";

export const courseOfferingSchema = z.object({
  id: z.number().int().optional(),
  courseType: z.string(),
  curriculumId: z.number().int(),
  description: z.string().nullable().optional(),
  sectionName: z.string(),
  yearLevel: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CourseOffering = z.infer<typeof courseOfferingSchema>;
