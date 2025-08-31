import { Request, Response } from "express";
import BlogPost from "../models/blogPost.model";

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const blogPosts = await BlogPost.find();
    res.status(200).json({ blogPosts: blogPosts });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const getBlogPostById = async (req: Request, res: Response) => {
  try {
    const blogPost = await BlogPost.findById(req.params);
    res.status(200).json({ blogPost: blogPost });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
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
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const updatedBlogPost = await BlogPost.updateOne(
      { _id: req.body.blogPost.id },
      req.body.blogPost
    );
    res.status(200).json({
      message: "BlogPost Data Updated Successfully",
      blogPost: updatedBlogPost,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const blogPost = await BlogPost.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "BlogPost Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};
