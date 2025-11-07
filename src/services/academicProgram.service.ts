import { db } from "../utils/db.server";
import { AcademicProgram } from "@prisma/client";

export const listAcademicPrograms = async (): Promise<AcademicProgram[]> => {
  return db.academicProgram.findMany();
};

export const getAcademicProgramById = async (
  id: number
): Promise<AcademicProgram | null> => {
  return db.academicProgram.findUnique({ where: { id } });
};

export const createAcademicProgram = async (
  data: AcademicProgram
): Promise<AcademicProgram> => {
  return db.academicProgram.create({ data });
};

export const updateAcademicProgramData = async (
  id: number,
  data: AcademicProgram
): Promise<AcademicProgram> => {
  return db.academicProgram.update({ where: { id }, data });
};

export const deleteAcademicProgram = async (
  id: number
): Promise<AcademicProgram> => {
  return db.academicProgram.delete({ where: { id } });
};
