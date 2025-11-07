import { db } from "../utils/db.server";
import { User, UserRoles, Status } from "@prisma/client";
import { statusList, UserStatus } from "../constants/constants";
import { UserRegisterInput } from "../schema/user.schema";
import { JsonValue } from "@prisma/client/runtime/library";

// PublicUser type matches what we actually return from queries (without new faculty fields until migration)
// Using explicit interface to avoid Prisma type conflicts
interface PublicUser {
  id: number;
  image: string | null;
  firstname: string;
  lastname: string;
  middleInitial: string;
  email: string;
  designation: string;
  department: string;
  password: string;
  role: UserRoles;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  specialization: JsonValue;
}

export const listUsers = async (): Promise<PublicUser[]> => {
  return db.user.findMany({
    where: {
      status: {
        in: [statusList.VERIFIED, statusList.APPROVED],
      },
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      previousSubjects: true,
      yearsOfExperience: true,
      // maxTeachingLoad: true,
      preferredTimeSlots: true,
      availableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getUserById = async (id: number): Promise<PublicUser | null> => {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      // previousSubjects: true,
      // yearsOfExperience: true,
      // maxTeachingLoad: true,
      // preferredTimeSlots: true,
      // unavailableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getUserByEmail = async (email: string): Promise<PublicUser | null> => {
  return db.user.findFirst({
    where: {
      email,
      status: {
        in: [statusList.VERIFIED, statusList.APPROVED],
      },
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      // previousSubjects: true,
      // yearsOfExperience: true,
      // maxTeachingLoad: true,
      // preferredTimeSlots: true,
      // unavailableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const createUser = async (
  data: UserRegisterInput
): Promise<PublicUser> => {
  const {
    image,
    firstname,
    lastname,
    middleInitial,
    email,
    designation,
    department,
    specialization,
    password,
    role,
    status,
    previousSubjects,
    yearsOfExperience,
    preferredTimeSlots,
    availableDays,
  } = data;

  return db.user.create({
    data: {
      image,
      firstname,
      lastname,
      middleInitial,
      email,
      designation,
      department,
      specialization: specialization as any, // Type assertion for JSON field
      password,
      role,
      status,
      previousSubjects: previousSubjects as any,
      yearsOfExperience,
      preferredTimeSlots: preferredTimeSlots as any,
      availableDays: availableDays as any,
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
export const updateUser = async (
  id: number,
  data: Partial<UserRegisterInput>
): Promise<PublicUser> => {
  // Parse specialization if it's a string
  let specialization = data.specialization;
  if (typeof data.specialization === 'string') {
    try {
      specialization = JSON.parse(data.specialization);
    } catch (e) {
      specialization = data.specialization;
    }
  }

  // Parse array fields if they're strings
  let previousSubjects = data.previousSubjects;
  if (typeof data.previousSubjects === 'string') {
    try {
      previousSubjects = JSON.parse(data.previousSubjects);
    } catch (e) {
      previousSubjects = data.previousSubjects;
    }
  }

  let preferredTimeSlots = data.preferredTimeSlots;
  if (typeof data.preferredTimeSlots === 'string') {
    try {
      preferredTimeSlots = JSON.parse(data.preferredTimeSlots);
    } catch (e) {
      preferredTimeSlots = data.preferredTimeSlots;
    }
  }

  let availableDays = data.availableDays;
  if (typeof data.availableDays === 'string') {
    try {
      availableDays = JSON.parse(data.availableDays);
    } catch (e) {
      availableDays = data.availableDays;
    }
  }

  return db.user.update({
    where: { id },
    data: {
      ...(data as any), // Cast to any to avoid type mismatch with extra props
      specialization: specialization as any, // Type assertion for JSON field
      previousSubjects: previousSubjects as any,
      preferredTimeSlots: preferredTimeSlots as any,
      availableDays: availableDays as any,
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const updatePassword = async (email: string, password: string) => {
  return db.user.update({
    where: { email },
    data: { password },
  });
};

export const updateStatus = async (
  email: string,
  status: UserStatus
): Promise<PublicUser> => {
  return db.user.update({
    where: { email },
    data: { status },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      // previousSubjects: true,
      // yearsOfExperience: true,
      // maxTeachingLoad: true,
      // preferredTimeSlots: true,
      // unavailableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const deleteUser = async (id: number): Promise<User> => {
  return db.user.delete({
    where: { id },
  });
};

export const deleteUserByEmail = async (
  email: string
): Promise<User | null> => {
  const existingUser = await db.user.findFirst({
    where: {
      email,
      status: statusList.PENDING,
    },
  });

  if (!existingUser) return null;

  return db.user.delete({
    where: { id: existingUser.id },
  });
};

export const getFacultyByDepartment = async (department: string): Promise<PublicUser[]> => {
  return db.user.findMany({
    where: {
      department,
      role: 'FACULTY',
      status: {
        in: [statusList.VERIFIED, statusList.APPROVED],
      },
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      // previousSubjects: true,
      // yearsOfExperience: true,
      // maxTeachingLoad: true,
      // preferredTimeSlots: true,
      // unavailableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getInstructors = async (): Promise<PublicUser[]> => {
  return db.user.findMany({
    where: {
      role: {
        in: [UserRoles.FACULTY, UserRoles.DEPARTMENT_HEAD, UserRoles.CAMPUS_ADMIN],
      },
      status: {
        in: [statusList.APPROVED],
      },
    },
    select: {
      id: true,
      image: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      designation: true,
      department: true,
      specialization: true,
      role: true,
      status: true,
      password: true,
      // previousSubjects: true,
      // yearsOfExperience: true,
      // maxTeachingLoad: true,
      // preferredTimeSlots: true,
      // unavailableDays: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};