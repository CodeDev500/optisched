import express from "express";
import * as UserController from "../controllers/user.controller";
import { upload } from "../config/cloudinary";

const router = express.Router();

// Get all users
router.get("/", UserController.getAllUsers);

// Get user by ID
router.get("/id/:id", UserController.getUserById);

// Get all faculty
router.get("/faculty", UserController.getAllFaculty);

// Get faculty with teaching load
// router.get("/faculty/with-load/:curriculumYear/:semester/:id", UserController.getFacultyWithLoad);
router.get("/faculty/with-load", UserController.getFacultyWithLoad);
// Get faculty by department
router.get("/faculty/department/:department", UserController.getFacultyByDepartment);

// Get instructors
router.get("/instructor", UserController.getInstructor);

// Update user (including status and image)
router.put("/:id", upload.single("image"), UserController.updateUser);

// Delete user
router.delete("/:id", UserController.deleteUser);

export default router;
