import { Router } from 'express';
import { getTotalUnits, updateTotalUnits, createTotalUnits } from '../controllers/totalUnitsController';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get total units configuration (accessible by all authenticated users)
router.get('/', getTotalUnits);

// Update total units configuration (only CAMPUS_ADMIN)
router.put('/', updateTotalUnits);

// Create total units configuration (only CAMPUS_ADMIN)
router.post('/', createTotalUnits);

export default router;