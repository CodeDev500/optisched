import { Router } from 'express';
import {
  getFacultySubjects,
  addFacultySubject,
  removeFacultySubject,
  updateFacultySubject,
  getAvailableSubjects,
  bulkAssignSubjects
} from '../controllers/facultySubjectController';


const router = Router();

// Get all subjects assigned to a specific faculty
router.get('/faculty/:facultyId', getFacultySubjects);

// Add a subject assignment to a faculty
router.post('/faculty/:facultyId', addFacultySubject);

// Remove a subject assignment from a faculty
router.delete('/assignment/:assignmentId', removeFacultySubject);

// Update a subject assignment
router.put('/assignment/:assignmentId', updateFacultySubject);

// Get all available subjects that can be assigned
router.get('/available-subjects', getAvailableSubjects);

// Bulk assign subjects to faculty
router.post('/faculty/:facultyId/bulk', bulkAssignSubjects);

export default router;