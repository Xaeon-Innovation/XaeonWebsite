import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
require("dotenv").config();

import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { corsOptions } from "./config/cors.config";

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

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

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/blog-post", blogPostRouter);
app.use("/api/v1/package", packageRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/project-type", projectTypeRouter);
app.use("/api/v1/employee", employeeRouter);
app.use("/api/v1/system-request", systemRequestRouter);
app.use("/api/v1/user", userRouter);

app.use(errorHandler);

app.listen(process.env.BACKEND_PORT);
