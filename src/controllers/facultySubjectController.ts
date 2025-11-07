import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all subjects assigned to a specific faculty
export const getFacultySubjects = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;

    if (!facultyId) {
      res.status(400).json({
        success: false,
        message: 'Faculty ID is required'
      });
      return;
    }

    const facultySubjects = await prisma.facultySubjectAssignment.findMany({
      where: {
        facultyId: parseInt(facultyId)
      },
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
            designation: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: facultySubjects,
      message: 'Faculty subjects retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching faculty subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add a subject assignment to a faculty
export const addFacultySubject = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;
    const {
      subjectCode,
      subjectDescription,
      units,
      dayOfWeek,
      startTime,
      endTime,
      room,
      yearLevel,
      semester,
      section
    } = req.body;

    if (!facultyId || !subjectCode || !subjectDescription || !units) {
      res.status(400).json({
        success: false,
        message: 'Faculty ID, subject code, description, and units are required'
      });
      return;
    }

    // Check if faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: parseInt(facultyId) }
    });

    if (!faculty) {
      res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
      return;
    }

    // Check for existing assignment with same subject and faculty
    const existingAssignment = await prisma.facultySubjectAssignment.findFirst({
      where: {
        facultyId: parseInt(facultyId),
        subjectCode: subjectCode,
        dayOfWeek: dayOfWeek,
        startTime: startTime
      }
    });

    if (existingAssignment) {
      res.status(409).json({
        success: false,
        message: 'Subject assignment already exists for this faculty at the specified time'
      });
      return;
    }

    const newAssignment = await prisma.facultySubjectAssignment.create({
      data: {
        facultyId: parseInt(facultyId),
        subjectCode,
        subjectDescription,
        units: parseInt(units),
        dayOfWeek: dayOfWeek || '',
        startTime: startTime || '',
        endTime: endTime || '',
        room: room || null,
        yearLevel: yearLevel || null,
        semester: semester || null,
        section: section || null,
        status: 'DRAFT'
      },
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
            designation: true,
            department: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newAssignment,
      message: 'Subject assigned to faculty successfully'
    });
  } catch (error) {
    console.error('Error adding faculty subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Remove a subject assignment from a faculty
export const removeFacultySubject = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId) {
      res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
      return;
    }

    // Check if assignment exists
    const assignment = await prisma.facultySubjectAssignment.findUnique({
      where: { id: parseInt(assignmentId) }
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
      return;
    }

    await prisma.facultySubjectAssignment.delete({
      where: { id: parseInt(assignmentId) }
    });

    res.status(200).json({
      success: true,
      message: 'Subject assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing faculty subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update a subject assignment
export const updateFacultySubject = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;

    if (!assignmentId) {
      res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
      return;
    }

    // Check if assignment exists
    const assignment = await prisma.facultySubjectAssignment.findUnique({
      where: { id: parseInt(assignmentId) }
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
      return;
    }

    const updatedAssignment = await prisma.facultySubjectAssignment.update({
      where: { id: parseInt(assignmentId) },
      data: {
        ...updateData,
        units: updateData.units ? parseInt(updateData.units) : assignment.units,
        facultyId: updateData.facultyId ? parseInt(updateData.facultyId) : assignment.facultyId
      },
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
            designation: true,
            department: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: 'Subject assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating faculty subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all available subjects that can be assigned
export const getAvailableSubjects = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;

    let whereClause = {};
    if (department) {
      whereClause = {
        programCode: department as string
      };
    }

    const subjects = await prisma.curriculumCourse.findMany({
      where: whereClause,
      select: {
        id: true,
        subjectCode: true,
        subjectDescription: true,
        units: true,
        lec: true,
        lab: true,
        yearLevel: true,
        period: true,
        programCode: true,
        programName: true
      },
      orderBy: {
        subjectCode: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: subjects,
      message: 'Available subjects retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching available subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Bulk assign subjects to faculty
export const bulkAssignSubjects = async (req: Request, res: Response) => {
  try {
    const { facultyId } = req.params;
    const { assignments } = req.body;

    if (!facultyId || !assignments || !Array.isArray(assignments)) {
      res.status(400).json({
        success: false,
        message: 'Faculty ID and assignments array are required'
      });
      return;
    }

    // Check if faculty exists
    const faculty = await prisma.user.findUnique({
      where: { id: parseInt(facultyId) }
    });

    if (!faculty) {
      res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
      return;
    }

    const createdAssignments = await prisma.facultySubjectAssignment.createMany({
      data: assignments.map((assignment: any) => ({
        facultyId: parseInt(facultyId),
        subjectCode: assignment.subjectCode,
        subjectDescription: assignment.subjectDescription,
        units: parseInt(assignment.units),
        dayOfWeek: assignment.dayOfWeek || '',
        startTime: assignment.startTime || '',
        endTime: assignment.endTime || '',
        room: assignment.room || null,
        yearLevel: assignment.yearLevel || null,
        semester: assignment.semester || null,
        section: assignment.section || null,
        status: 'DRAFT'
      })),
      skipDuplicates: true
    });

    res.status(201).json({
      success: true,
      data: { count: createdAssignments.count },
      message: `${createdAssignments.count} subjects assigned to faculty successfully`
    });
  } catch (error) {
    console.error('Error bulk assigning subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};