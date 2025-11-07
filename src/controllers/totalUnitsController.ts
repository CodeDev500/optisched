import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get total units configuration
export const getTotalUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    let totalUnitsConfig = await prisma.totalUnits.findFirst();
    
    // If no configuration exists, create default one
    if (!totalUnitsConfig) {
      totalUnitsConfig = await prisma.totalUnits.create({
        data: {
          totalUnits: 18
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: totalUnitsConfig
    });
  } catch (error) {
    console.error('Error fetching total units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total units configuration'
    });
  }
};

// Update total units configuration
export const updateTotalUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { totalUnits } = req.body;
    
    if (!totalUnits || totalUnits < 1) {
      res.status(400).json({
        success: false,
        message: 'Total units must be a positive number'
      });
      return;
    }
    
    // Check if configuration exists
    let totalUnitsConfig = await prisma.totalUnits.findFirst();
    
    if (totalUnitsConfig) {
      // Update existing configuration
      totalUnitsConfig = await prisma.totalUnits.update({
        where: { id: totalUnitsConfig.id },
        data: { totalUnits: parseInt(totalUnits) }
      });
    } else {
      // Create new configuration
      totalUnitsConfig = await prisma.totalUnits.create({
        data: { totalUnits: parseInt(totalUnits) }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Total units configuration updated successfully',
      data: totalUnitsConfig
    });
  } catch (error) {
    console.error('Error updating total units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update total units configuration'
    });
  }
};

// Create initial total units configuration
export const createTotalUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { totalUnits = 18 } = req.body;
    
    // Check if configuration already exists
    const existingConfig = await prisma.totalUnits.findFirst();
    
    if (existingConfig) {
      res.status(400).json({
        success: false,
        message: 'Total units configuration already exists'
      });
      return;
    }
    
    const totalUnitsConfig = await prisma.totalUnits.create({
      data: {
        totalUnits: parseInt(totalUnits)
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Total units configuration created successfully',
      data: totalUnitsConfig
    });
  } catch (error) {
    console.error('Error creating total units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create total units configuration'
    });
  }
};