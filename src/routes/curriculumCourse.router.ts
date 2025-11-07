import express from "express";
import * as CurriculumCourseController from "../controllers/curriculumCourse.controller";
import { deleteCurriculumSubject } from "../controllers/curriculumCourse.controller";

const router = express.Router();

router.get("/", CurriculumCourseController.getAllCurriculums);
router.get("/:id", CurriculumCourseController.getCurriculum);
router.post("/add", CurriculumCourseController.createCurriculum);
router.put("/:id", CurriculumCourseController.updateCurriculum);
router.delete("/:id", CurriculumCourseController.getCurriculum);
router.get(
  "/filter/:programCode/:yearLevel",
  CurriculumCourseController.getCurriculumByProgramAndYear
);
router.get(
  "/search/:programCode/:yearLevel",
  CurriculumCourseController.searchSubjectsBySemester
);
router.delete("/subject/:id", deleteCurriculumSubject);

export default router;
