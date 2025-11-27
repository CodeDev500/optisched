import { db } from "../utils/db.server";
import { AcademicProgram } from "@prisma/client";

export const listAcademicPrograms = async (): Promise<AcademicProgram[]> => {
  return db.academicProgram.findMany({
    orderBy: { priority: 'asc' } // Order by priority (lower number = higher priority)
  });
};

export const getAcademicProgramById = async (
  id: number
): Promise<AcademicProgram | null> => {
  return db.academicProgram.findUnique({ where: { id } });
};

export const createAcademicProgram = async (
  data: AcademicProgram
): Promise<AcademicProgram> => {
  // If no priority is provided, set it to the next available priority
  if (!data.priority) {
    const maxPriority = await db.academicProgram.findFirst({
      orderBy: { priority: 'desc' },
      select: { priority: true }
    });
    data.priority = maxPriority && maxPriority.priority ? maxPriority.priority + 1 : 1;
  }
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
  // Get the program to be deleted
  const programToDelete = await db.academicProgram.findUnique({ where: { id } });
  
  if (!programToDelete) {
    throw new Error('Program not found');
  }

  // Delete the program
  const deletedProgram = await db.academicProgram.delete({ where: { id } });

  // Reorder priorities for remaining programs with higher priority numbers
  if (programToDelete.priority !== null && programToDelete.priority !== undefined) {
    await db.academicProgram.updateMany({
      where: {
        priority: { gt: programToDelete.priority }
      },
      data: {
        priority: { decrement: 1 }
      }
    });
  }

  return deletedProgram;
};

// New function to update priorities in bulk
export const updateProgramPriorities = async (
  priorities: { id: number; priority: number }[]
): Promise<void> => {
  await db.$transaction(
    priorities.map(({ id, priority }) =>
      db.academicProgram.update({
        where: { id },
        data: { priority }
      })
    )
  );
};
