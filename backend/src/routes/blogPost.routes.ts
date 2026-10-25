import express from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  getBlogPosts,
  updateBlogPost,
} from "../controllers/blogPost.controller";
import { optionalAuth, requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

// Visitors see published posts; admins (optionalAuth) also see drafts.
router.get("/", optionalAuth, getBlogPosts);
router.get("/slug/:slug", getBlogPostBySlug);
router.get("/:id", optionalAuth, getBlogPostById);

router.post("/", requireAuth, requireAdmin, createBlogPost);
router.put("/", requireAuth, requireAdmin, updateBlogPost);
router.delete("/:id", requireAuth, requireAdmin, deleteBlogPost);

export default router;
