import * as SubjectController from "../controllers/subject.controller";
import express from "express";

const router = express.Router();

router.get("/", SubjectController.getAllSubjects);
router.get("/:id", SubjectController.getSubject);
router.post("/", SubjectController.addSubject);
router.put("/:id", SubjectController.updateSubject);
router.delete("/:id", SubjectController.deleteSubject);
router.get("/search/:query", SubjectController.searchSubject);

export default router;
