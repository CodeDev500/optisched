import { z } from "zod";

export const roomSchedulesSchema = z.object({
  id: z.number().int().optional(),
  day: z.string(),
  timeStarts: z.string(),
  timeEnds: z.string(),
  room: z.string(),
  offeringId: z.number().int().nullable().optional(),
  instructorId: z.number().int().nullable().optional(),
  isLoaded: z.number().int(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type RoomSchedules = z.infer<typeof roomSchedulesSchema>;
