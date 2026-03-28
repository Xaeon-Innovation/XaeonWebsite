"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blogPost_controller_1 = require("../controllers/blogPost.controller");
const router = express_1.default.Router();
router.get("/", blogPost_controller_1.getBlogPosts);
router.get("/:id", blogPost_controller_1.getBlogPostById);
router.post("/", blogPost_controller_1.createBlogPost);
router.put("/", blogPost_controller_1.updateBlogPost);
router.delete("/:id", blogPost_controller_1.deleteBlogPost);
exports.default = router;
