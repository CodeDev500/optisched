import { Router } from "express";
import * as UserSubjectController from "../controllers/userSubject.controller";
import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Assign subject to user (faculty)
router.post("/assign", UserSubjectController.assignSubjectToUser);

// Get all subjects assigned to a specific user
router.get("/user/:userId", UserSubjectController.getUserSubjects);

// Get all users assigned to a specific subject
router.get("/subject/:subjectId", UserSubjectController.getSubjectUsers);

// Remove subject assignment from user
router.delete("/user/:userId/subject/:subjectId", UserSubjectController.removeSubjectFromUser);

// Get all user-subject assignments
router.get("/assignments", UserSubjectController.getAllUserSubjects);

// Get all faculty with their assigned subjects
router.get("/faculty-subjects", UserSubjectController.getFacultyWithSubjects);

export default router;