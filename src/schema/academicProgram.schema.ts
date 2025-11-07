import { z } from "zod";

export const academicProgramSchema = z.object({
  id: z.number().int().optional(),
  department: z.string().nullable().optional(),
  programCode: z.string().nullable().optional(),
  programName: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AcademicProgram = z.infer<typeof academicProgramSchema>;
