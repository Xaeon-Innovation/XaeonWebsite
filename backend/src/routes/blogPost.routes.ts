import express from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPosts,
  updateBlogPost,
} from "../controllers/blogPost.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

router.get("/", getBlogPosts);
router.get("/:id", getBlogPostById);

router.post("/", requireAuth, requireAdmin, createBlogPost);

router.put("/", requireAuth, requireAdmin, updateBlogPost);

router.delete("/:id", requireAuth, requireAdmin, deleteBlogPost);

export default router;
