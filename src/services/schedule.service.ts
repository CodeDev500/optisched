import { CurriculumCourse } from "@prisma/client";
import { db } from "../utils/db.server";

export const listSchedule = async (): Promise<CurriculumCourse[]> => {
  return db.curriculumCourse.findMany();
};

export const getScheduleById = async (
  id: number
): Promise<CurriculumCourse | null> => {
  return db.curriculumCourse.findUnique({ where: { id } });
};

export const createSchedule = async (
  data: CurriculumCourse
): Promise<CurriculumCourse> => {
  return db.curriculumCourse.create({ data });
};
