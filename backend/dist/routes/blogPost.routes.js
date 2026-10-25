"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blogPost_controller_1 = require("../controllers/blogPost.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Visitors see published posts; admins (optionalAuth) also see drafts.
router.get("/", auth_1.optionalAuth, blogPost_controller_1.getBlogPosts);
router.get("/slug/:slug", blogPost_controller_1.getBlogPostBySlug);
router.get("/:id", auth_1.optionalAuth, blogPost_controller_1.getBlogPostById);
router.post("/", auth_1.requireAuth, auth_1.requireAdmin, blogPost_controller_1.createBlogPost);
router.put("/", auth_1.requireAuth, auth_1.requireAdmin, blogPost_controller_1.updateBlogPost);
router.delete("/:id", auth_1.requireAuth, auth_1.requireAdmin, blogPost_controller_1.deleteBlogPost);
exports.default = router;
