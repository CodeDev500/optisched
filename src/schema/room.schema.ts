import { z } from "zod";

export const roomSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  capacity: z.number().int(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Room = z.infer<typeof roomSchema>;
