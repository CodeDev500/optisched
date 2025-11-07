import { Subject } from "../schema/subject.schema";
import { db } from "../utils/db.server";

export const createSubject = async (data: any): Promise<Subject> => {
  const { subjectCode, subjectDescription, lec, lab, units, tags, prerequisite } = data;
  try {
    return await db.subject.create({
      data: { subjectCode, subjectDescription, lec, lab, units, tags, prerequisite },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('subjectCode')) {
      throw new Error(`Subject code '${subjectCode}' already exists`);
    }
    throw error;
  }
};

export const listSubjects = async (): Promise<Subject[]> => {
  return db.subject.findMany();
};

export const getSubjectById = async (id: number): Promise<Subject | null> => {
  return db.subject.findUnique({ where: { id } });
};

export const updateSubjectData = async (
  id: number,
  data: any
): Promise<Subject> => {
  const { subjectCode, subjectDescription, lec, lab, units, tags, prerequisite } = data;
  try {
    return await db.subject.update({
      where: { id },
      data: { subjectCode, subjectDescription, lec, lab, units, tags, prerequisite },
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('subjectCode')) {
      throw new Error(`Subject code '${subjectCode}' already exists`);
    }
    throw error;
  }
};

export const deleteSubject = async (id: number): Promise<Subject> => {
  return db.subject.delete({ where: { id } });
};

export const searchSubjectQuery = async (query: string): Promise<Subject[]> => {
  return db.subject.findMany({
    where: {
      OR: [
        { subjectCode: { contains: query } },
        { subjectDescription: { contains: query } },
      ],
    },
  });
};
