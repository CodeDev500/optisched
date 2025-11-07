import { hashPassword } from "./../utils/bcryptHandler";
import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import { sendOTPController } from "./otp.controller";
import * as OtpService from "../services/otp.service";
import { compareOTP } from "../utils/bcryptHandler";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await UserService.getUserByEmail(email);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await sendOTPController(email);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OtpService.getOtpByEmail(email);

    if (!otpRecord) {
      res.status(404).json({ message: "Invalid OTP. Please try again" });
      return;
    }

    const { expiresAt, otp: storedOTP } = otpRecord;

    if (new Date(expiresAt).getTime() < Date.now()) {
      await OtpService.deleteOTP(email);
      res
        .status(400)
        .json({ message: "OTP expired. Please request a new one" });
      return;
    }

    const isMatch = await compareOTP(otp, storedOTP);

    if (!isMatch) {
      res.status(400).json({ message: "Invalid OTP. Please try again" });
      return;
    }

    await OtpService.deleteOTP(email);
    res
      .status(200)
      .json({ message: "OTP verified successfully", status: "success" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await hashPassword(password);
    await UserService.updatePassword(email, hashedPassword);

    await OtpService.deleteOTP(email);
    res
      .status(200)
      .json({ message: "Password reset successfully", status: "success" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
