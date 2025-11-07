import { Otp } from "@prisma/client";
import { generatedOTP } from "./../utils/generatedOTP";
import { sendEmail } from "../utils/sendEmailTransporter";
import { db } from "../utils/db.server";

export const createOTP = async (data: {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}) => {
  const { email, otp, createdAt, expiresAt } = data;

  return db.otp.create({
    data: {
      email,
      otp,
      createdAt,
      expiresAt,
    },
    select: {
      email: true,
      otp: true,
      createdAt: true,
      expiresAt: true,
    },
  });
};

export const getOtpByEmail = async (email: string): Promise<Otp | null> => {
  return db.otp.findFirst({ where: { email } });
};

export const deleteOTP = async (email: string) => {
  return db.otp.deleteMany({ where: { email } });
};
