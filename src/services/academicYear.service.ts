import { db } from '../utils/db.server';

export const AcademicYearService = {
  // Get all academic years
  async getAllAcademicYears() {
    return await db.academicYear.findMany({
      orderBy: {
        year: 'desc'
      }
    });
  },

  // Get active academic year
  async getActiveAcademicYear() {
    return await db.academicYear.findFirst({
      where: {
        isActive: true
      }
    });
  },

  // Create new academic year
  async createAcademicYear(year: string) {
    // Check if year already exists
    const existing = await db.academicYear.findUnique({
      where: { year }
    });

    if (existing) {
      throw new Error('Academic year already exists');
    }

    return await db.academicYear.create({
      data: {
        year,
        isActive: false
      }
    });
  },

  // Update academic year
  async updateAcademicYear(id: number, year: string) {
    return await db.academicYear.update({
      where: { id },
      data: { year }
    });
  },

  // Set active academic year
  async setActiveAcademicYear(id: number) {
    // First, set all to inactive
    await db.academicYear.updateMany({
      data: {
        isActive: false
      }
    });

    // Then set the selected one to active
    return await db.academicYear.update({
      where: { id },
      data: {
        isActive: true
      }
    });
  },

  // Delete academic year
  async deleteAcademicYear(id: number) {
    const academicYear = await db.academicYear.findUnique({
      where: { id }
    });

    if (academicYear?.isActive) {
      throw new Error('Cannot delete active academic year');
    }

    return await db.academicYear.delete({
      where: { id }
    });
  }
};
