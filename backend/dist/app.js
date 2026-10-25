"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "..", ".env") });
require("./types/expressAugment");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const cors_config_1 = require("./config/cors.config");
const siteUpload_config_1 = require("./config/siteUpload.config");
(0, siteUpload_config_1.ensureSiteUploadDir)();
const app = (0, express_1.default)();
// Requests arrive via the Vercel /api proxy and then nginx, so trust two hops for req.ip.
app.set("trust proxy", 2);
app.disable("x-powered-by");
// Middleware
// Uploaded images are embedded on xaeons.com, so allow cross-origin reads of resources.
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use((0, cors_1.default)(cors_config_1.corsOptions));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "100kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "100kb" }));
app.use(logger_1.logger);
app.use("/uploads", express_1.default.static((0, siteUpload_config_1.getUploadRoot)(), {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
}));
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
// Connecting to MongoDB
const database_config_1 = __importDefault(require("./config/database.config"));
(0, database_config_1.default)();
// Routes Setup
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const blogPost_routes_1 = __importDefault(require("./routes/blogPost.routes"));
const package_routes_1 = __importDefault(require("./routes/package.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const projectType_routes_1 = __importDefault(require("./routes/projectType.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const serviceRequest_routes_1 = __importDefault(require("./routes/serviceRequest.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const site_routes_1 = __importDefault(require("./routes/site.routes"));
const teamMember_routes_1 = __importDefault(require("./routes/teamMember.routes"));
const caseStudy_routes_1 = __importDefault(require("./routes/caseStudy.routes"));
const testimonial_routes_1 = __importDefault(require("./routes/testimonial.routes"));
const siteUpload_routes_1 = __importDefault(require("./routes/siteUpload.routes"));
const siteSettings_routes_1 = __importDefault(require("./routes/siteSettings.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/blog-post", blogPost_routes_1.default);
app.use("/api/v1/package", package_routes_1.default);
app.use("/api/v1/project", project_routes_1.default);
app.use("/api/v1/project-type", projectType_routes_1.default);
app.use("/api/v1/employee", employee_routes_1.default);
app.use("/api/v1/system-request", serviceRequest_routes_1.default);
app.use("/api/v1/user", user_routes_1.default);
app.use("/api/v1/site", site_routes_1.default);
app.use("/api/v1/team-member", teamMember_routes_1.default);
app.use("/api/v1/case-study", caseStudy_routes_1.default);
app.use("/api/v1/testimonial", testimonial_routes_1.default);
app.use("/api/v1/admin", siteUpload_routes_1.default);
app.use("/api/v1/admin/site-settings", siteSettings_routes_1.default);
app.use("/api/v1/bookings", booking_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.use(errorHandler_1.errorHandler);
const port = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 5000;
app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
