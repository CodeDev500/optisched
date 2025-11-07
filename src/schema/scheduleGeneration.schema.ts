import { z } from 'zod';

export const ScheduleItemSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subject: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
  subjectDescription: z.string().optional().nullable(),
  faculty: z.string(),
  facultyId: z.string(),
  facultyName: z.string(),
  room: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  time: z.string(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  semester: z.string(),
  academicYear: z.string(),
  program: z.string(),
  yearLevel: z.string(),
  credits: z.number(),
  units: z.number(),
  type: z.string(),
  students: z.string().optional(),
  section: z.string().optional(),
  tags: z.array(z.any()).optional(),
  hasConflict: z.boolean().optional(),
  status: z.string().optional(),
  conflictType: z.string().optional()
});

export const SaveScheduleArrayPayloadSchema = z.object({
  schedules: z.array(ScheduleItemSchema)
});

export const SaveScheduleStructuredPayloadSchema = z.object({
  department: z.string(),
  academicYear: z.string(),
  semester: z.string(),
  yearLevel: z.string().optional(),
  scheduleData: z.any(),
  notes: z.string().optional()
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type SaveScheduleArrayPayload = z.infer<typeof SaveScheduleArrayPayloadSchema>;
export type SaveScheduleStructuredPayload = z.infer<typeof SaveScheduleStructuredPayloadSchema>;