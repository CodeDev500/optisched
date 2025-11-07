import express from "express";
import * as AuthController from "../controllers/auth.controller";
import * as OtpController from "../controllers/otp.controller";
import * as forgotPasswordController from "../controllers/forgotPassword.controller";

const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "./uploads" });

router.post("/register", upload.single("image"), AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/verify-otp", OtpController.verifyOTP);
router.post("/resend-otp", OtpController.resendOTP);
router.post("/forgot-password", forgotPasswordController.forgotPassword);
router.post("/verify-forgot-password", forgotPasswordController.verifyOTP);
router.put("/reset-password", forgotPasswordController.resetPassword);

export default router;
