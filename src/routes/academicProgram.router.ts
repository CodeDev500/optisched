import * as AcademicProgramController from "../controllers/academicProgram.controller";
import express from "express";

const router = express.Router();

router.get("/", AcademicProgramController.getAcademicPrograms);
router.get("/:id", AcademicProgramController.getAcademicProgram);
router.post("/", AcademicProgramController.addAcademicProgram);
router.put("/priorities/update", AcademicProgramController.updateProgramPriorities);
router.put("/:id", AcademicProgramController.updateAcademicProgram);
router.delete("/:id", AcademicProgramController.deleteAcademicProgram);

export default router;
