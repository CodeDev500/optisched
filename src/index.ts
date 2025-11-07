import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { verifyToken } from "./middlewares/verifyToken";
import { refreshToken } from "./middlewares/refreshToken";
import authRoutes from "./routes/auth.router";
import userRoutes from "./routes/user.router";
import subjectRoutes from "./routes/subjects.router";
import userSubjectRoutes from "./routes/userSubject.router";
import academicProgramRoutes from "./routes/academicProgram.router";
import curriculumRoutes from "./routes/curriculumCourse.router";
import schedulesRoutes from "./routes/schedules.router";
import roomRoutes from "./routes/room.router";
import totalUnitsRoutes from "./routes/totalUnitsRoutes";
import facultySubjectAssignmentRoutes from "./routes/facultySubjectAssignment.router";
import facultySubjectRoutes from "./routes/facultySubjectRoutes";
import scheduleGenerationRoutes from "./routes/scheduleGeneration.router";
import specializationRoutes from "./routes/specialization.router";
import programPriorityRoutes from "./routes/programPriority.router";
import { facultyRecommendationRouter } from "./routes/facultyRecommendation.router";
import academicYearRoutes from "./routes/academicYear.router";

dotenv.config();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  method: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
// Increase payload limit to handle large schedule data (default is 100kb)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());

app.use(express.static("public"));
// Note: File uploads are now handled by Cloudinary, not local storage
// app.use("/uploads", express.static("uploads")); // Removed - using Cloudinary

app.use("/specializations", specializationRoutes);
app.use("/auth", authRoutes);
app.post("/refresh", refreshToken);
app.use("/protected", verifyToken, async (req: Request, res: Response) => {
  res.json({
    user: req.user?.user,
    message: "You are authorized to access this protected resouces",
  });
  return;
});

// check verify user middleware
app.use(verifyToken);
app.use("/user", userRoutes);
app.use("/subject", subjectRoutes);
app.use("/user-subject", userSubjectRoutes);
app.use("/program", academicProgramRoutes);
app.use("/curriculum", curriculumRoutes);
app.use("/schedules", schedulesRoutes);
app.use("/schedules/generation", scheduleGenerationRoutes);
app.use("/rooms", roomRoutes);
app.use("/total-units", totalUnitsRoutes);
app.use("/faculty-assignments", facultySubjectAssignmentRoutes);
app.use("/faculty-subjects", facultySubjectRoutes);

app.use("/program-priorities", programPriorityRoutes);
app.use("/faculty-recommendations", facultyRecommendationRouter);
app.use("/academic-years", academicYearRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
