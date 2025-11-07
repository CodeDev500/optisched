export const UserRoles = [
  "FACULTY",
  "DEPARTMENT_HEAD",
  "REGISTRAR",
  "CAMPUS_ADMIN",
] as const;

export const UserStatuses = ["PENDING", "VERIFIED", "APPROVED"] as const;

export const statusList = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  APPROVED: "APPROVED",
} as const;

export type UserRole = (typeof UserRoles)[number];
export type UserStatus = (typeof UserStatuses)[number];
