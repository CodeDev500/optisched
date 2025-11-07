import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create faculty subject assignments (publish schedules)
export const createFacultySubjectAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
      res.status(400).json({
        success: false,
        message: 'Assignments array is required'
      });
      return;
    }
    
    // Validate each assignment
    for (const assignment of assignments) {
      if (!assignment.facultyId || !assignment.subjectCode || !assignment.dayOfWeek || !assignment.startTime || !assignment.endTime) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields in assignment'
        });
        return;
      }
    }
    
    // Create assignments in transaction
    const createdAssignments = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const assignment of assignments) {
        const created = await tx.facultySubjectAssignment.create({
          data: {
            facultyId: parseInt(assignment.facultyId),
            subjectCode: assignment.subjectCode,
            subjectDescription: assignment.subjectDescription,
            units: assignment.units,
            dayOfWeek: assignment.dayOfWeek,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            room: assignment.room,
            yearLevel: assignment.yearLevel,
            semester: assignment.semester,
            section: assignment.section,
            status: 'PUBLISHED'
          },
          include: {
            faculty: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middleInitial: true,
                email: true,
                department: true
              }
            }
          }
        });
        results.push(created);
      }
      
      return results;
    });
    
    res.status(201).json({
      success: true,
      message: 'Faculty subject assignments created successfully',
      data: createdAssignments
    });
  } catch (error) {
    console.error('Error creating faculty subject assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create faculty subject assignments'
    });
  }
};

// Get faculty subject assignments by faculty ID
export const getFacultySubjectAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyId } = req.params;
    const { status } = req.query;
    
    if (!facultyId) {
      res.status(400).json({
        success: false,
        message: 'Faculty ID is required'
      });
      return;
    }
    
    const whereClause: any = {
      facultyId: parseInt(facultyId)
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    const assignments = await prisma.facultySubjectAssignment.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
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
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching faculty subject assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty subject assignments'
    });
  }
};

// Get all faculty subject assignments
export const getAllFacultySubjectAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, department } = req.query;
    
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (department) {
      whereClause.faculty = {
        department: department
      };
    }
    
    const assignments = await prisma.facultySubjectAssignment.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
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
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching all faculty subject assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty subject assignments'
    });
  }
};

// Update faculty subject assignment
export const updateFacultySubjectAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
      return;
    }
    
    const updatedAssignment = await prisma.facultySubjectAssignment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        faculty: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middleInitial: true,
            email: true,
            department: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Faculty subject assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating faculty subject assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update faculty subject assignment'
    });
  }
};

// Delete faculty subject assignment
export const deleteFacultySubjectAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
      return;
    }
    
    await prisma.facultySubjectAssignment.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Faculty subject assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting faculty subject assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete faculty subject assignment'
    });
  }
};

// Delete all assignments for a faculty (clear schedule)
export const clearFacultyAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyId } = req.params;
    
    if (!facultyId) {
      res.status(400).json({
        success: false,
        message: 'Faculty ID is required'
      });
      return;
    }
    
    await prisma.facultySubjectAssignment.deleteMany({
      where: { facultyId: parseInt(facultyId) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Faculty assignments cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing faculty assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear faculty assignments'
    });
  }
};