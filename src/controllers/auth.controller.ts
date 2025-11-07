import * as UserService from "../services/user.service";
import { Request, Response } from "express";
import { loginSchema, registerUserSchema } from "../schema/user.schema";
import fs from "fs";
import { hashPassword, comparePassword } from "../utils/bcryptHandler";
import { setTokens } from "../utils/jwtHandler";
import { statusList } from "../constants/constants";
import { UserRegisterInput } from "../schema/user.schema";
import { sendOTPController } from "./otp.controller";

export const register = async (req: Request, res: Response) => {
  try {
    // Clean up field names by trimming spaces and handle field parsing
    const cleanedBody: any = {};
    
    // Helper function to collect array items from FormData
    const collectArrayItems = (prefix: string): string[] => {
      const items: string[] = [];
      for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith(prefix) && key.includes('[') && key.includes(']')) {
          items.push(value as string);
        }
      }
      return items;
    };
    
    for (const [key, value] of Object.entries(req.body)) {
      const cleanKey = key.trim();
      
      // Skip array notation keys as they'll be handled separately
      if (cleanKey.includes('[') && cleanKey.includes(']')) {
        continue;
      }
      
      if (cleanKey === 'specialization' && typeof value === 'string') {
        try {
          cleanedBody[cleanKey] = JSON.parse(value as string);
        } catch (error) {
          // Try to collect from array notation
          const arrayItems = collectArrayItems('specialization');
          cleanedBody[cleanKey] = arrayItems.length > 0 ? arrayItems : [value];
        }
      } else if (cleanKey === 'yearsOfExperience' && typeof value === 'string') {
        // Parse yearsOfExperience from string to number
        const parsed = parseInt(value, 10);
        cleanedBody[cleanKey] = isNaN(parsed) ? 0 : parsed;
      } else if (cleanKey === 'previousSubjects' && typeof value === 'string') {
        try {
          cleanedBody[cleanKey] = JSON.parse(value as string);
        } catch (error) {
          // Try to collect from array notation
          const arrayItems = collectArrayItems('previousSubjects');
          cleanedBody[cleanKey] = arrayItems.length > 0 ? arrayItems : [value];
        }
      } else if (cleanKey === 'preferredTimeSlots' && typeof value === 'string') {
        try {
          cleanedBody[cleanKey] = JSON.parse(value as string);
        } catch (error) {
          // Try to collect from array notation
          const arrayItems = collectArrayItems('preferredTimeSlots');
          cleanedBody[cleanKey] = arrayItems.length > 0 ? arrayItems : [value];
        }
      } else if (cleanKey === 'availableDays' && typeof value === 'string') {
        try {
          cleanedBody[cleanKey] = JSON.parse(value as string);
        } catch (error) {
          // Try to collect from array notation
          const arrayItems = collectArrayItems('availableDays');
          cleanedBody[cleanKey] = arrayItems.length > 0 ? arrayItems : [value];
        }
      } else {
        cleanedBody[cleanKey] = value;
      }
    }
    
    // Handle array notation fields
    const arrayFields = ['specialization', 'previousSubjects', 'preferredTimeSlots', 'availableDays'];
    for (const field of arrayFields) {
      if (!cleanedBody[field]) {
        const arrayItems = collectArrayItems(field);
        if (arrayItems.length > 0) {
          cleanedBody[field] = arrayItems;
        }
      }
    }
    
    req.body = cleanedBody;

    const parseResult = registerUserSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const userRequest = parseResult.data;

    const userExists = await UserService.getUserByEmail(userRequest.email);

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    } else {
      await UserService.deleteUserByEmail(userRequest.email);
    }

    let newFilename: null | string = null;
    if (req.file) {
      console.log('File received:', req.file);
      let filetype: string = req.file.mimetype.split("/")[1];
      newFilename = req.file.filename + "." + filetype;

      fs.renameSync(
        `./uploads/${req.file.filename}`,
        `./uploads/${newFilename}`
      );
      userRequest.image = `uploads/${newFilename}`;
      console.log('Image path set to:', userRequest.image);
    } else {
      console.log('No file received in request');
    }

    if (userRequest.password) {
      userRequest.password = await hashPassword(userRequest.password);
    }

    const user = await UserService.createUser(userRequest as UserRegisterInput);

    if (userRequest.status === statusList.PENDING) {
      await sendOTPController(userRequest.email);
      res.status(200).json({
        status: "success",
        message: `Verification OTP sent to ${userRequest.email}`,
      });
      return;
    }

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const userRequest = parsed.data;

    const user = await UserService.getUserByEmail(userRequest.email);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.status === statusList.VERIFIED) {
      res.status(401).json({ message: "Please wait for admin approval" });
      return;
    }

    const isMatch = await comparePassword(userRequest.password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const accessToken = setTokens(res, user);

    res.status(200).json({
      message: "Login successfully",
      user,
      accessToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logout successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
