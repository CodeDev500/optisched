import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomSchedules
} from '../controllers/room.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET /api/rooms - Get all rooms
router.get('/', getAllRooms);

// GET /api/rooms/:id - Get room by ID
router.get('/:id', getRoomById);

// POST /api/rooms - Create new room
router.post('/', createRoom);

// PUT /api/rooms/:id - Update room
router.put('/:id', updateRoom);
// GET /api/room-schedules/:roomName - Get room schedules by room name
router.get('/schedules/:roomName', getRoomSchedules);
// DELETE /api/rooms/:id - Delete room
router.delete('/:id', deleteRoom);

export default router;