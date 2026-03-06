import express from "express";
require("dotenv").config();

import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";

const app = express();

// Middleware
app.use(logger);
app.use(errorHandler);

// Connecting to MongoDB
import db from "./config/database.config";
db();

// Routes Setup
import authRouter from "./routes/auth.routes";
import blogPostRouter from "./routes/blogPost.routes";
import packageRouter from "./routes/package.routes";
import projectTypeRouter from "./routes/projectType.routes";
import systemRequestRouter from "./routes/serviceRequest.routes";
import userRouter from "./routes/user.routes";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/blog-post", blogPostRouter);
app.use("/api/v1/package", packageRouter);
app.use("/api/v1/project-type", projectTypeRouter);
app.use("/api/v1/system-request", systemRequestRouter);
app.use("/api/v1/user", userRouter);

app.listen(process.env.BACKEND_PORT);
