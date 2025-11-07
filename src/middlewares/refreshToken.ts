import { setTokens } from "./../utils/jwtHandler";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as UserService from "../services/user.service";
require("dotenv").config();

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN!,
      async (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err || !decoded?.user?.id) {
          console.log(decoded);
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        const user = await UserService.getUserById(decoded.user.id);

        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }

        req.user = decoded;
        setTokens(res, user);
        res.status(200).json({ message: "Tokens refreshed" });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized" });
  }
};
