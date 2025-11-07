import { z } from "zod";

export const curriculumCourseSchema = z.object({
  id: z.number().int().optional(),
  curriculumYear: z.string(),
  programCode: z.string(),
  programName: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  lec: z.number().int().nullable().optional(),
  lab: z.number().int().nullable().optional(),
  units: z.number().int(),
  hours: z.number().int(),
  period: z.string(),
  yearLevel: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CurriculumCourse = z.infer<typeof curriculumCourseSchema>;
