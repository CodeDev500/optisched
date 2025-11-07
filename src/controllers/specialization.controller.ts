import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, department } = req.body;

    const existingSpecialization = await prisma.specialization.findUnique({
      where: { name }
    });

    if (existingSpecialization) {
      res.status(400).json({
        success: false,
        message: 'Specialization with this name already exists'
      });
      return;
    }

    const specialization = await prisma.specialization.create({
      data: {
        name,
        description,
        department
      }
    });

    res.status(201).json({
      success: true,
      message: 'Specialization created successfully',
      data: specialization
    });
  } catch (error) {
    console.error('Error creating specialization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllSpecializations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, isActive } = req.query;
    
    const where: any = {};
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const specializations = await prisma.specialization.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: specializations
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpecializationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const specialization = await prisma.specialization.findUnique({
      where: { id: parseInt(id) }
    });

    if (!specialization) {
      res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: specialization
    });
  } catch (error) {
    console.error('Error fetching specialization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, department, isActive } = req.body;

    const existingSpecialization = await prisma.specialization.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSpecialization) {
      res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
      return;
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== existingSpecialization.name) {
      const nameConflict = await prisma.specialization.findUnique({
        where: { name }
      });

      if (nameConflict) {
        res.status(400).json({
          success: false,
          message: 'Specialization with this name already exists'
        });
        return;
      }
    }

    const updatedSpecialization = await prisma.specialization.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.status(200).json({
      success: true,
      message: 'Specialization updated successfully',
      data: updatedSpecialization
    });
  } catch (error) {
    console.error('Error updating specialization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingSpecialization = await prisma.specialization.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSpecialization) {
      res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
      return;
    }

    await prisma.specialization.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Specialization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting specialization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const toggleSpecializationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingSpecialization = await prisma.specialization.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSpecialization) {
      res.status(404).json({
        success: false,
        message: 'Specialization not found'
      });
      return;
    }

    const updatedSpecialization = await prisma.specialization.update({
      where: { id: parseInt(id) },
      data: { isActive: !existingSpecialization.isActive }
    });

    res.status(200).json({
      success: true,
      message: `Specialization ${updatedSpecialization.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedSpecialization
    });
  } catch (error) {
    console.error('Error toggling specialization status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};