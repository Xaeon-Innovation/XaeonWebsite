import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import "./types/expressAugment";

import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { corsOptions } from "./config/cors.config";
import { ensureSiteUploadDir, getUploadRoot } from "./config/siteUpload.config";

ensureSiteUploadDir();

const app = express();

// Requests arrive via the Vercel /api proxy and then nginx, so trust two hops for req.ip.
app.set("trust proxy", 2);
app.disable("x-powered-by");

// Middleware
// Uploaded images are embedded on xaeons.com, so allow cross-origin reads of resources.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(
  express.json({
    limit: "100kb",
    // Payment webhooks are signed over the exact bytes received.
    verify: (req, _res, buf) => {
      if (req.url?.includes("/payments/")) (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(logger);

app.use(
  "/uploads",
  express.static(getUploadRoot(), {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Connecting to MongoDB (tests connect their own database instead).
import db from "./config/database.config";
if (process.env.NODE_ENV !== "test") db();

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
import testimonialRouter from "./routes/testimonial.routes";
import leadRouter from "./routes/lead.routes";
import { startFollowUpDigest } from "./jobs/followUpDigest";
import siteUploadRouter from "./routes/siteUpload.routes";
import siteSettingsRouter from "./routes/siteSettings.routes";
import bookingRouter from "./routes/booking.routes";
import builderRouter from "./routes/builder.routes";
import builderAdminRouter from "./routes/builderAdmin.routes";

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
app.use("/api/v1/testimonial", testimonialRouter);
app.use("/api/v1/lead", leadRouter);
app.use("/api/v1/admin", siteUploadRouter);
app.use("/api/v1/admin/site-settings", siteSettingsRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/builder", builderRouter);
app.use("/api/v1/admin/builder", builderAdminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;

// Only start the server and jobs when run directly (node dist/app.js), not when imported by tests.
if (require.main === module) {
  const port =
    Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 5000;
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
    startFollowUpDigest();
  });
}
