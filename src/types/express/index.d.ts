import * as multer from "multer";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      file?: multer.File;
      files?: multer.File[];
    }
  }
}

export {};
