import { Request, Response } from 'express';
import { AcademicYearService } from '../services/academicYear.service';

// Get all academic years
export const getAllAcademicYears = async (req: Request, res: Response) => {
  try {
    const academicYears = await AcademicYearService.getAllAcademicYears();
    res.status(200).json({
      success: true,
      data: academicYears
    });
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch academic years'
    });
  }
};

// Get active academic year
export const getActiveAcademicYear = async (req: Request, res: Response) => {
  try {
    const activeYear = await AcademicYearService.getActiveAcademicYear();
    res.status(200).json({
      success: true,
      data: activeYear
    });
  } catch (error: any) {
    console.error('Error fetching active academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active academic year'
    });
  }
};

// Create academic year
export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;

    if (!year) {
       res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
      return
    }

    const academicYear = await AcademicYearService.createAcademicYear(year);
    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: academicYear
    });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create academic year'
    });
  }
};

// Update academic year
export const updateAcademicYear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { year } = req.body;

    if (!year) {
       res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
      return
    }

    const academicYear = await AcademicYearService.updateAcademicYear(parseInt(id), year);
    res.status(200).json({
      success: true,
      message: 'Academic year updated successfully',
      data: academicYear
    });
  } catch (error: any) {
    console.error('Error updating academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update academic year'
    });
  }
};

// Set active academic year
export const setActiveAcademicYear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const academicYear = await AcademicYearService.setActiveAcademicYear(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Active academic year set successfully',
      data: academicYear
    });
  } catch (error: any) {
    console.error('Error setting active academic year:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active academic year'
    });
  }
};

// Delete academic year
export const deleteAcademicYear = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await AcademicYearService.deleteAcademicYear(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete academic year'
    });
  }
};
