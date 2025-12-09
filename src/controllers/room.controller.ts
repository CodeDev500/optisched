import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { roomSchema } from '../schema/room.schema';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get all rooms
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    });
  }
};

// Get room by ID
export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room ID'
      });
      return;
    }
    
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room'
    });
  }
};

// Create new room
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = roomSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    
    // Check if room name already exists
    const existingRoom = await prisma.room.findFirst({
      where: {
        name: {
          equals: validatedData.name
        }
      }
    });
    
    if (existingRoom) {
      res.status(400).json({
        success: false,
        message: 'Room with this name already exists'
      });
      return;
    }
    
    const room = await prisma.room.create({
      data: validatedData
    });
    
    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }
    
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    });
  }
};

// Update room
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room ID'
      });
      return;
    }
    
    const validatedData = roomSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!existingRoom) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    // Check if room name already exists (excluding current room)
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        name: {
          equals: validatedData.name
        },
        id: {
          not: roomId
        }
      }
    });
    
    if (duplicateRoom) {
      res.status(400).json({
        success: false,
        message: 'Room with this name already exists'
      });
      return;
    }
    
    const room = await prisma.room.update({
      where: { id: roomId },
      data: validatedData
    });
    
    res.status(200).json({
      success: true,
      data: room,
      message: 'Room updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }
    
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room'
    });
  }
};

// Delete room
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roomId = parseInt(id);
    
    if (isNaN(roomId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid room ID'
      });
      return;
    }
    
    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!existingRoom) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }
    
    await prisma.room.delete({
      where: { id: roomId }
    });
    
    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
};


// Get room schedules by room name, academic year, and semester
export const getRoomSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const { roomName } = req.params;
    const { academicYear, semester } = req.query;

    if (!academicYear || !semester) {
      res.status(400).json({
        success: false,
        message: 'Academic year and semester are required'
      });
      return;
    }

    // Fetch schedules from SubjectSchedule table
    const schedules = await prisma.subjectSchedule.findMany({
      where: {
        roomName: roomName,
        academicYear: academicYear as string,
        semester: semester as string,
      }
    });

    console.log(schedules)

    // Transform the data to match the frontend interface
    const transformedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subjectCode: schedule.subjectCode,
      subjectName: schedule.subjectName,
      facultyName: schedule.facultyName,
      program: schedule.program,
      yearLevel: schedule.yearLevel,
      semester: schedule.semester,
      academicYear: schedule.academicYear
    }));

    res.status(200).json({
      success: true,
      data: transformedSchedules
    });
  } catch (error) {
    console.error('Error fetching room schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room schedules'
    });
  }
};