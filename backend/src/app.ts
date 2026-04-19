import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import "./types/expressAugment";

import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { corsOptions } from "./config/cors.config";
import { ensureSiteUploadDir, getUploadRoot } from "./config/siteUpload.config";

ensureSiteUploadDir();

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use("/uploads", express.static(getUploadRoot()));

// Connecting to MongoDB
import db from "./config/database.config";
db();

// Routes Setup
import authRouter from "./routes/auth.routes";
import blogPostRouter from "./routes/blogPost.routes";
import packageRouter from "./routes/package.routes";
import projectRouter from "./routes/project.routes";
import projectTypeRouter from "./routes/projectType.routes";
import employeeRouter from "./routes/employee.routes";
import systemRequestRouter from "./routes/serviceRequest.routes";
import userRouter from "./routes/user.routes";
import siteRouter from "./routes/site.routes";
import teamMemberRouter from "./routes/teamMember.routes";
import caseStudyRouter from "./routes/caseStudy.routes";
import siteUploadRouter from "./routes/siteUpload.routes";
import siteSettingsRouter from "./routes/siteSettings.routes";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/blog-post", blogPostRouter);
app.use("/api/v1/package", packageRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/project-type", projectTypeRouter);
app.use("/api/v1/employee", employeeRouter);
app.use("/api/v1/system-request", systemRequestRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/site", siteRouter);
app.use("/api/v1/team-member", teamMemberRouter);
app.use("/api/v1/case-study", caseStudyRouter);
app.use("/api/v1/admin", siteUploadRouter);
app.use("/api/v1/admin/site-settings", siteSettingsRouter);

app.use(errorHandler);

const port =
  Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 5000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
