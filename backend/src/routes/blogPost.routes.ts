import express from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPosts,
  updateBlogPost,
} from "../controllers/blogPost.controller";
const router = express.Router();

router.get("/", getBlogPosts);
router.get("/:id", getBlogPostById);

router.post("/", createBlogPost);

router.put("/", updateBlogPost);

router.delete("/:id", deleteBlogPost);

export default router;
