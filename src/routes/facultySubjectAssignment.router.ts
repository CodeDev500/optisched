import { Router } from 'express';
import {
  createFacultySubjectAssignments,
  getFacultySubjectAssignments,
  getAllFacultySubjectAssignments,
  updateFacultySubjectAssignment,
  deleteFacultySubjectAssignment,
  clearFacultyAssignments
} from '../controllers/facultySubjectAssignment.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create faculty subject assignments (publish schedules)
router.post('/', createFacultySubjectAssignments);

// Get all faculty subject assignments
router.get('/', getAllFacultySubjectAssignments);

// Get faculty subject assignments by faculty ID
router.get('/faculty/:facultyId', getFacultySubjectAssignments);

// Update faculty subject assignment
router.put('/:id', updateFacultySubjectAssignment);

// Delete faculty subject assignment
router.delete('/:id', deleteFacultySubjectAssignment);

// Clear all assignments for a faculty
router.delete('/faculty/:facultyId/clear', clearFacultyAssignments);

export default router;