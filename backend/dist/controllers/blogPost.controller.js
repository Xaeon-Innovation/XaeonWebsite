"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogPost = exports.updateBlogPost = exports.createBlogPost = exports.getBlogPostById = exports.getBlogPosts = void 0;
const blogPost_model_1 = __importDefault(require("../models/blogPost.model"));
const getBlogPosts = async (req, res) => {
    try {
        const blogPosts = await blogPost_model_1.default.find();
        res.status(200).json({ blogPosts });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch blog posts",
        });
    }
};
exports.getBlogPosts = getBlogPosts;
const getBlogPostById = async (req, res) => {
    try {
        const blogPost = await blogPost_model_1.default.findById(req.params.id);
        if (!blogPost) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        res.status(200).json({ blogPost });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch blog post",
        });
    }
};
exports.getBlogPostById = getBlogPostById;
const createBlogPost = async (req, res) => {
    try {
        const newBlogPost = await blogPost_model_1.default.create(req.body.blogPost);
        res.status(200).json({
            message: "New Blog Post Created Successfully",
            blogPost: newBlogPost,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create blog post",
        });
    }
};
exports.createBlogPost = createBlogPost;
const updateBlogPost = async (req, res) => {
    try {
        const id = req.body.blogPost?.id;
        if (!id) {
            res.status(400).json({ error: "Blog post id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.blogPost ?? {};
        const updatedBlogPost = await blogPost_model_1.default.findByIdAndUpdate(id, update, {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update blog post",
        });
    }
};
exports.updateBlogPost = updateBlogPost;
const deleteBlogPost = async (req, res) => {
    try {
        const result = await blogPost_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        res.status(200).json({ message: "BlogPost Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete blog post",
        });
    }
};
exports.deleteBlogPost = deleteBlogPost;
