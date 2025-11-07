import * as ProgramPriorityController from "../controllers/programPriority.controller";
import express from "express";

const router = express.Router();

router.get("/", ProgramPriorityController.getProgramPriorities);
router.get("/:id", ProgramPriorityController.getProgramPriority);
router.post("/save", ProgramPriorityController.saveProgramPriorities);
router.put("/:id", ProgramPriorityController.updateProgramPriority);
router.delete("/:id", ProgramPriorityController.deleteProgramPriority);

export default router;