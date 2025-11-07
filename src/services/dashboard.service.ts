import { db } from "../utils/db.server";

export const getDashboardStats = async () => {
  try {
    // Get total users count
    const totalUsers = await db.user.count();
    
    // Get faculty count (assuming faculty have specific roles)
// Get faculty count
    const facultyCount = await db.user.count({
      where: {
        role: 'FACULTY'
      }
    });
    
    // Get visiting lecturers count (assuming they have a specific designation)
    const visitingLecturers = await db.user.count({
      where: {
        designation: {
          contains: 'Visiting'
        }
      }
    });
    
    // Get total schedules count from room schedules
    const totalSchedules = await db.roomSchedules.count({
      where: {
        
      }
    });
    
    // Get total subjects/courses
    const totalSubjects = await db.curriculumCourse.count();
    
    // Get total programs
    const totalPrograms = await db.curriculumCourse.groupBy({
      by: ['programCode'],
      _count: {
        programCode: true
      }
    });
    
    // Get active schedules for current semester
    const activeSchedules = await db.roomSchedules.count({
      where: {
        
        isLoaded: {
          gte: 1
        }
      }
    });
    
    return {
      totalUsers,
      totalFaculty: facultyCount,
      visitingLecturers,
      totalSchedules,
      totalSubjects,
      totalPrograms: totalPrograms.length,
      activeSchedules,
      pendingUsers: await db.user.count({
        where: {
          status: 'PENDING'
        }
      }),
      verifiedUsers: await db.user.count({
        where: {
          status: 'VERIFIED'
        }
      })
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
};