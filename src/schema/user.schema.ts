import { z } from "zod";
import { UserRoles, UserStatuses } from "../constants/constants";
import { User } from "@prisma/client";

export const registerUserSchema = z
  .object({
    image: z.string().nullable().optional(),
    firstname: z.string().trim().min(1, { message: "First name is required" }),
    lastname: z.string().trim().min(1, { message: "Last name is required" }),
    middleInitial: z
      .string()
      .trim()
      .min(1, { message: "Middle initial is required" }),
    email: z
      .string()
      .trim()
      .email({ message: "Invalid email address e.g. sample@gmail.com" }),
    designation: z
      .string()
      .trim()
      .min(1, { message: "Designation is required" }),
    department: z.string().trim().min(1, { message: "Department is required" }),
    specialization: z
      .array(z.string().trim())
      .optional()
      .nullable(),
    password: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .trim()
      .min(8, { message: "Password must be at least 8 characters" }),
    role: z.enum(UserRoles),
    status: z.enum(UserStatuses),
    // New fields for faculty recommendation
    previousSubjects: z
      .array(z.string().trim())
      .optional()
      .nullable(),
    yearsOfExperience: z
      .number()
      .int()
      .min(0)
      .max(50)
      .optional()
      .nullable(),
    preferredTimeSlots: z
      .array(z.string().trim())
      .optional()
      .nullable(),
    availableDays: z
      .array(z.string().trim())
      .optional()
      .nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address e.g. sample@gmail.com" }),
  password: z.string().trim().min(8, {
    message: "Password must be at least 8 characters long",
  }),
});

export type Register = z.infer<typeof registerUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type UserRegisterInput = Omit<
  User,
  "id" | "createdAt" | "updatedAt"
> & {
  specialization?: string[] | null;
  confirmPassword?: string;
  previousSubjects?: string[] | null;
  yearsOfExperience?: number | null;
  preferredTimeSlots?: string[] | null;
  availableDays?: string[] | null;
};
