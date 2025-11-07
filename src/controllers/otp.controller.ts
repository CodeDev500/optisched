import { sendOTP } from "../utils/sendOTP";
import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import * as OtpService from "../services/otp.service";
import { compareOTP } from "../utils/bcryptHandler";
import { statusList } from "../constants/constants";
import { sendNotification } from "../utils/emailNotifications";

export const sendOTPController = async (email: string) => {
  try {
    const createdOTP = await sendOTP({
      email,
      subject: "Optisched OTP Verification",
      message: "Please enter the following OTP to verify your account:",
      duration: 5,
    });

    return createdOTP;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const matchedOTP = await OtpService.getOtpByEmail(email);

    if (!matchedOTP) {
      res.status(404).json({ message: "Invalid OTP. Please try again" });
      return;
    }

    const { expiresAt, otp: storedOTP } = matchedOTP;

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

    const updateStatus = await UserService.updateStatus(
      email,
      statusList.VERIFIED
    );

    if (updateStatus) {
      await sendNotification({
        email,
        subject: "WMSU OptiSched Account Verified",
        message:
          "Your account has been verified successfully. Please wait for admin approval.",
      });
    }

    await OtpService.deleteOTP(email);

    res
      .status(200)
      .json({ message: "OTP verified successfully", status: "success" });
    return;
  } catch (error: any) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
    return;
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    await OtpService.deleteOTP(email);

    const createdOTP = await sendOTPController(email);

    res.status(200).json({
      message: "OTP resent successfully",
      createdOTP,
      status: "success",
    });
  } catch (error: any) {
    console.error("resendOTP error:", error);
    res.status(500).json({ message: error.message });
    return;
  }
};
