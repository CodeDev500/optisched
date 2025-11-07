import express from "express";
import * as AuthController from "../controllers/auth.controller";
import * as OtpController from "../controllers/otp.controller";
import * as forgotPasswordController from "../controllers/forgotPassword.controller";
import { upload } from "../config/cloudinary";

const router = express.Router();

router.post("/register", upload.single("image"), AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/verify-otp", OtpController.verifyOTP);
router.post("/resend-otp", OtpController.resendOTP);
router.post("/forgot-password", forgotPasswordController.forgotPassword);
router.post("/verify-forgot-password", forgotPasswordController.verifyOTP);
router.put("/reset-password", forgotPasswordController.resetPassword);

export default router;
