import express from "express";
import * as FacultyRecommendationController from "../controllers/facultyRecommendation.controller";

const router = express.Router();

// Get faculty recommendations for a specific subject
router.get("/subject/:subjectId", FacultyRecommendationController.getFacultyRecommendationsForSubject);

// Get faculty recommendations for a specific curriculum course
router.get("/curriculum-course/:curriculumCourseId", FacultyRecommendationController.getFacultyRecommendationsForCurriculumCourse);

// Get faculty recommendations for all courses in a program and year level
router.get("/program/:programCode/:yearLevel", FacultyRecommendationController.getFacultyRecommendationsForProgram);

export { router as facultyRecommendationRouter };