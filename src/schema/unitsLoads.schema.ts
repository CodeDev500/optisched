import { z } from "zod";

export const unitsLoadsSchema = z.object({
  id: z.number().int().optional(),
  instructorId: z.number().int().nullable().optional(),
  units: z.number().int(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UnitsLoads = z.infer<typeof unitsLoadsSchema>;
