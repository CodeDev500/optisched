import { z } from "zod";

export const notificationSchema = z.object({
  id: z.number().int().optional(),
  content: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Notification = z.infer<typeof notificationSchema>;
