import { Otp } from "@prisma/client";
import { generatedOTP } from "./generatedOTP";
import { sendEmail } from "./sendEmailTransporter";
const { AUTH_EMAIL } = process.env;
import * as OtpService from "../services/otp.service";
import { hashPassword } from "./bcryptHandler";

interface OTP {
  email: string;
  subject: string;
  message: string;
  duration: number;
}

export const sendOTP = async ({ email, subject, message, duration }: OTP) => {
  try {
    if (!email && subject && message) {
      throw Error("Email, subject and message are required");
    }

    await OtpService.deleteOTP(email);

    const generate = await generatedOTP();

    //send email
    const mailOptions = {
      from: AUTH_EMAIL,
      to: email,
      subject,
      html: `
            <p style="font-size: 18px; color: #333; margin-bottom: 10px;">${message}</p>

            <p style="color: tomato; font-size: 25px; letter-spacing: 2px; margin-bottom: 20px;"><b>${generate}</b></p>
        
            <p style="font-size: 16px; color: #555; margin-bottom: 10px;">Please note that this OTP is valid <b>for ${duration} minute(s)</b>.</p>
        
            <p style="font-size: 16px; color: #777; margin-top: 20px;">For security reasons, please do not share your OTP with anyone.</p>
            `,
    };

    await sendEmail(mailOptions);

    const hashOTP = await hashPassword(generate);

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + duration * 60 * 1000);

    await OtpService.createOTP({
      email,
      otp: hashOTP,
      createdAt: new Date(),
      expiresAt: expiresAt,
    });
  } catch (err: any) {
    throw err;
  }
};
