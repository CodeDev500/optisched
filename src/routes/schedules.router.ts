import { Router, Request, Response } from "express";
import {
  getSubjectsWithSchedules,
  getSubjectsByProgramAndYear,
  updateSchedule,
  createSchedule,
  deleteSchedule,
  getInstructors,
  submitForApproval,
  getLatestSchedules,
} from "../controllers/schedules.controller";

const router = Router();

// Get latest schedules (all active subject schedules)
router.get("/latest", getLatestSchedules);

// Get all subjects with schedules filtered by program, year level, and semester
router.get("/subjects/:programCode/:yearLevel/:semester", getSubjectsWithSchedules);

// Get all subjects by program and year level (without semester filter)
router.get("/subjects/:programCode/:yearLevel", getSubjectsByProgramAndYear);

// Create a new schedule
router.post("/", createSchedule);

// Update an existing schedule
router.put("/:id", updateSchedule);

// Delete a schedule
router.delete("/:id", deleteSchedule);

// Get all instructors for assignment
router.get("/instructors", getInstructors);

// Submit schedules for approval
router.post("/submit-for-approval", submitForApproval);

export default router;