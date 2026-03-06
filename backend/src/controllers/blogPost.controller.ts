import type { Request, Response } from "express";
import BlogPost from "../models/blogPost.model";

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const blogPosts = await BlogPost.find();
    res.status(200).json({ blogPosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch blog posts",
    });
  }
};

export const getBlogPostById = async (req: Request, res: Response) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    res.status(200).json({ blogPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch blog post",
    });
  }
};

export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const newBlogPost = await BlogPost.create(req.body.blogPost);
    res.status(200).json({
      message: "New Blog Post Created Successfully",
      blogPost: newBlogPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create blog post",
    });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const id = req.body.blogPost?.id;
    if (!id) {
      res.status(400).json({ error: "Blog post id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.blogPost ?? {};
    const updatedBlogPost = await BlogPost.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updatedBlogPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    res.status(200).json({
      message: "BlogPost Data Updated Successfully",
      blogPost: updatedBlogPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update blog post",
    });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const result = await BlogPost.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    res.status(200).json({ message: "BlogPost Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete blog post",
    });
  }
};
