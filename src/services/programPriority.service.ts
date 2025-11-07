import { db } from "../utils/db.server";
import { ProgramPriority } from "@prisma/client";

export const listProgramPriorities = async (): Promise<ProgramPriority[]> => {
  return db.programPriority.findMany({
    orderBy: { priority: 'asc' } // Order by priority (1 = highest priority)
  });
};

export const getProgramPriorityById = async (
  id: number
): Promise<ProgramPriority | null> => {
  return db.programPriority.findUnique({ where: { id } });
};

export const getProgramPriorityByCode = async (
  programCode: string
): Promise<ProgramPriority | null> => {
  return db.programPriority.findUnique({ where: { programCode } });
};

export const saveProgramPriorities = async (
  priorities: Array<{ programCode: string; programName: string; priority: number; department?: string }>
): Promise<ProgramPriority[]> => {
  // Use transaction to ensure data consistency
  return db.$transaction(async (prisma) => {
    // Delete existing priorities to replace with new ones
    await prisma.programPriority.deleteMany();
    
    // Create new priorities
    const createdPriorities = await Promise.all(
      priorities.map((priority) =>
        prisma.programPriority.create({
          data: {
            programCode: priority.programCode,
            programName: priority.programName,
            priority: priority.priority,
            department: priority.department || null,
          },
        })
      )
    );
    
    return createdPriorities;
  });
};

export const createProgramPriority = async (
  data: Omit<ProgramPriority, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProgramPriority> => {
  return db.programPriority.create({ data });
};

export const updateProgramPriorityData = async (
  id: number,
  data: Partial<Omit<ProgramPriority, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ProgramPriority> => {
  return db.programPriority.update({ where: { id }, data });
};

export const deleteProgramPriorityById = async (
  id: number
): Promise<ProgramPriority> => {
  return db.programPriority.delete({ where: { id } });
};