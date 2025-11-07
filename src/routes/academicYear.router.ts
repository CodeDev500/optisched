import express from 'express';
import * as AcademicYearController from '../controllers/academicYear.controller';

const router = express.Router();

// Get all academic years
router.get('/', AcademicYearController.getAllAcademicYears);

// Get active academic year
router.get('/active', AcademicYearController.getActiveAcademicYear);

// Create academic year
router.post('/', AcademicYearController.createAcademicYear);

// Update academic year
router.put('/:id', AcademicYearController.updateAcademicYear);

// Set active academic year
router.put('/:id/activate', AcademicYearController.setActiveAcademicYear);

// Delete academic year
router.delete('/:id', AcademicYearController.deleteAcademicYear);

export default router;
