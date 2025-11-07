import { Router } from 'express';
import {
  createSpecialization,
  getAllSpecializations,
  getSpecializationById,
  updateSpecialization,
  deleteSpecialization,
  toggleSpecializationStatus
} from '../controllers/specialization.controller';
import {
  createSpecializationSchema,
  updateSpecializationSchema,
  getSpecializationByIdSchema,
  deleteSpecializationSchema,
  toggleSpecializationStatusSchema,
  getSpecializationsQuerySchema
} from '../schema/specialization.schema';
import { validate } from '../middlewares/validate';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

// Apply authentication middleware to all routes
// router.use(verifyToken);

// GET /api/specializations - Get all specializations with optional filters
router.get('/', validate(getSpecializationsQuerySchema), getAllSpecializations);

// GET /api/specializations/:id - Get specialization by ID
router.get('/:id', validate(getSpecializationByIdSchema), getSpecializationById);

// POST /api/specializations - Create new specialization
router.post('/', validate(createSpecializationSchema), createSpecialization);

// PUT /api/specializations/:id - Update specialization
router.put('/:id', validate(updateSpecializationSchema), updateSpecialization);

// DELETE /api/specializations/:id - Delete specialization
router.delete('/:id', validate(deleteSpecializationSchema), deleteSpecialization);

// PATCH /api/specializations/:id/toggle - Toggle specialization active status
router.patch('/:id/toggle', validate(toggleSpecializationStatusSchema), toggleSpecializationStatus);

export default router;