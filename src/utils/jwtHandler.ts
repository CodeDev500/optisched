import jwt from "jsonwebtoken";
import { Response } from "express";
import { User } from "@prisma/client";
require("dotenv").config();

// Use Partial<User> to allow user objects without the new faculty fields until migration
type TPayload = { user: Partial<User> };

export const generateToken = (payload: TPayload): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN!, { expiresIn: "1d" });
};

export const generateRefreshToken = (payload: TPayload): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN!, { expiresIn: "1d" });
};

export const setTokens = (res: Response, user: Partial<User>): string => {
  const accessToken = generateToken({ user });
  const refreshToken = generateRefreshToken({ user });

  res.cookie("accessToken", accessToken, {
    // httpOnly: true,
    maxAge: 26 * 60 * 60 * 1000, // 1 day in milliseconds
    // secure: true,
    // sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    // sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });

  return accessToken;
};
