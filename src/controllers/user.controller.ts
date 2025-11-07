import { User } from "@prisma/client";
import * as UserService from "../services/user.service";
import { Request, Response } from "express";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(parseInt(id));

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFacultyByDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const faculty = await UserService.getFacultyByDepartment(department);

    res.status(200).json(faculty);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllFaculty = async (req: Request, res: Response) => {
  try {
    const faculty = await UserService.listUsers();
    const filteredFaculty = faculty.filter(user => user.role === 'FACULTY' );

    res.status(200).json(filteredFaculty);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getInstructor = async (req: Request, res: Response) => {
  try {
    const instructors = await UserService.getInstructors()
    res.status(200).json(instructors);
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserService.listUsers();
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user (including status)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle uploaded image
    if (req.file) {
      updateData.image = req.file.path;
    }
    
    const updatedUser = await UserService.updateUser(parseInt(id), updateData);
    
    res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      data: updatedUser 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update user" 
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await UserService.deleteUser(parseInt(id));
    
    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete user" 
    });
  }
};

// Get faculty with teaching load
export const getFacultyWithLoad = async (req: Request, res: Response) => {
  try {
    // const { curriculumYear, semester } = req.params;
    const faculty = await UserService.listUsers();

    // Get teaching load for each faculty from subject_schedules
    const { db } = await import('../utils/db.server');
    
    // Get max units from TotalUnits table
    const totalUnitsSettings = await db.totalUnits.findFirst();
    const maxUnits = totalUnitsSettings?.totalUnits;
    
    const facultyWithLoad = await Promise.all(
      faculty.map(async (facultyMember) => {
        // Get all schedules for this faculty
        const schedules = await db.subjectSchedule.findMany({
          where: {
            facultyId: String(facultyMember.id),
            isActive: true,
            // academicYear: String(curriculumYear),
            // semester: String(semester),
          },
        });

        // Calculate total units (sum of all subject units)
        const totalUnits = schedules.reduce((sum, schedule) => sum + schedule.units, 0);
        const totalSubjects = schedules.length;

        // Calculate hours per week: (lec × 1) + (lab × 3)
        const currentSemesterLoad = schedules.reduce((sum, schedule) => {
          return sum + (schedule.lec * 1) + (schedule.lab * 3);
        }, 0);

        return {
          ...facultyMember,
          totalSubjects,
          totalUnits,
          currentSemesterLoad,
          maxUnits, // Max units from settings
        };
      })
    );

    res.status(200).json(facultyWithLoad);
  } catch (error: any) {
    console.error('Error fetching faculty with load:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFacultyLoadById = async (req: Request, res: Response) => {
  try {
    const { id, curriculumYear, semester } = req.params;
    // const faculty = await UserService.getFacultyById(parseInt(id));
    // res.status(200).json(faculty);
  } catch (error: any) {
    console.error('Error fetching faculty by ID:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

