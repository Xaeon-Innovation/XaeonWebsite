"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogPost = exports.updateBlogPost = exports.createBlogPost = exports.getBlogPostBySlug = exports.getBlogPostById = exports.getBlogPosts = void 0;
exports.slugify = slugify;
const mongoose_1 = __importDefault(require("mongoose"));
const blogPost_model_1 = __importStar(require("../models/blogPost.model"));
const employee_model_1 = __importDefault(require("../models/employee.model"));
const publishHooks_1 = require("../services/publishHooks");
const serverError_1 = require("../utils/serverError");
/** Latin + Arabic letters and digits, hyphen-separated. */
function slugify(text) {
    return text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9؀-ۿ]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}
async function uniqueSlug(base, excludeId) {
    const root = base || "post";
    for (let i = 1; i < 200; i += 1) {
        const candidate = i === 1 ? root : `${root}-${i}`;
        const clash = await blogPost_model_1.default.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
        if (!clash)
            return candidate;
    }
    return `${root}-${Date.now()}`;
}
function excerptFrom(markdown) {
    const plain = markdown
        .replace(/!\[[^\]]*]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
        .replace(/[#>*_`~-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return plain.length > 200 ? `${plain.slice(0, 197).replace(/\s+\S*$/, "")}…` : plain;
}
/** Shape sent to clients: legacy posts get content/excerpt/status/publishedAt filled in. */
function toPublic(post) {
    const doc = post;
    const p = (typeof doc.toObject === "function" ? doc.toObject() : post);
    const content = p.content || p.description || "";
    return {
        ...p,
        content,
        excerpt: p.excerpt || excerptFrom(content),
        status: p.status ?? "published",
        publishedAt: p.publishedAt ?? (p.status ? undefined : p.createdAt),
        tags: p.tags ?? [],
    };
}
function isAdmin(req) {
    return req.user?.role === "admin";
}
const optStr = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : undefined;
/** Whitelisted, validated fields from an admin payload. */
async function readPayload(body, existing) {
    const fields = {};
    const title = optStr(body.title, 200);
    if (title !== undefined) {
        if (!title)
            return { fields, error: "Title is required" };
        fields.title = title;
    }
    for (const [key, max] of [["excerpt", 400], ["coverImageUrl", 500], ["coverAlt", 200], ["seoTitle", 70], ["seoDescription", 170]]) {
        const v = optStr(body[key], max);
        if (v !== undefined)
            fields[key] = v;
    }
    if (typeof body.content === "string")
        fields.content = body.content.slice(0, 100000);
    // Only web URLs (blocks javascript:, data: …); http is allowed for local development.
    if (fields.coverImageUrl && !/^https?:\/\//.test(fields.coverImageUrl))
        return { fields, error: "Cover image must be a web (http/https) URL" };
    if (Array.isArray(body.tags)) {
        fields.tags = [...new Set(body.tags.filter((t) => typeof t === "string").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
    }
    if (body.author !== undefined) {
        if (typeof body.author !== "string" || !mongoose_1.default.Types.ObjectId.isValid(body.author) || !(await employee_model_1.default.exists({ _id: body.author }))) {
            return { fields, error: "Choose an author" };
        }
        fields.author = new mongoose_1.default.Types.ObjectId(body.author);
    }
    if (body.status !== undefined) {
        if (!blogPost_model_1.BLOG_STATUSES.includes(body.status))
            return { fields, error: "Invalid status" };
        fields.status = body.status;
        // First publish stamps the date; republishing keeps the original.
        if (fields.status === "published" && !existing?.publishedAt)
            fields.publishedAt = new Date();
    }
    if (body.slug !== undefined) {
        const s = slugify(String(body.slug ?? ""));
        fields.slug = s ? await uniqueSlug(s, existing ? String(existing._id) : undefined) : undefined;
    }
    return { fields };
}
const getBlogPosts = async (req, res) => {
    try {
        const filter = isAdmin(req) ? {} : { ...blogPost_model_1.PUBLISHED_FILTER };
        if (typeof req.query.tag === "string" && req.query.tag.trim())
            filter.tags = req.query.tag.trim().toLowerCase();
        const blogPosts = await blogPost_model_1.default.find(filter)
            .select(isAdmin(req) ? "" : "-description")
            .populate("author", "name")
            .sort({ publishedAt: -1, createdAt: -1 })
            .lean();
        res.status(200).json({ blogPosts: blogPosts.map(toPublic) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch blog posts") });
    }
};
exports.getBlogPosts = getBlogPosts;
const getBlogPostById = async (req, res) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(String(req.params.id))) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        const blogPost = await blogPost_model_1.default.findOne({ _id: req.params.id, ...(isAdmin(req) ? {} : blogPost_model_1.PUBLISHED_FILTER) })
            .populate("author", "name")
            .lean();
        if (!blogPost) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        res.status(200).json({ blogPost: toPublic(blogPost) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch blog post") });
    }
};
exports.getBlogPostById = getBlogPostById;
const getBlogPostBySlug = async (req, res) => {
    try {
        const slug = String(req.params.slug ?? "").trim().toLowerCase().slice(0, 120);
        const blogPost = await blogPost_model_1.default.findOne({ slug, ...blogPost_model_1.PUBLISHED_FILTER }).populate("author", "name").lean();
        if (!blogPost) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        res.status(200).json({ blogPost: toPublic(blogPost) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch blog post") });
    }
};
exports.getBlogPostBySlug = getBlogPostBySlug;
const createBlogPost = async (req, res) => {
    try {
        const body = (req.body?.blogPost ?? {});
        const { fields, error } = await readPayload(body);
        if (error) {
            res.status(400).json({ error });
            return;
        }
        if (!fields.title || !fields.author) {
            res.status(400).json({ error: "Title and author are required" });
            return;
        }
        if (!fields.slug)
            fields.slug = await uniqueSlug(slugify(fields.title));
        const blogPost = await blogPost_model_1.default.create({ status: "draft", ...fields });
        if (blogPost.status === "published")
            (0, publishHooks_1.notifyContentChanged)(["/blog", `/blog/${blogPost.slug}`]);
        res.status(201).json({ message: "Blog post created", blogPost: toPublic(blogPost) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to create blog post") });
    }
};
exports.createBlogPost = createBlogPost;
const updateBlogPost = async (req, res) => {
    try {
        const body = (req.body?.blogPost ?? {});
        const id = body.id;
        if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Blog post id is required" });
            return;
        }
        const existing = await blogPost_model_1.default.findById(id);
        if (!existing) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        const { fields, error } = await readPayload(body, existing);
        if (error) {
            res.status(400).json({ error });
            return;
        }
        // Legacy posts: move the old plain-text body into `content` the first time they're edited.
        if (!existing.content && existing.description && fields.content === undefined)
            fields.content = existing.description;
        if (!existing.slug && !fields.slug)
            fields.slug = await uniqueSlug(slugify(fields.title ?? existing.title), id);
        if (!existing.status && !fields.status) {
            fields.status = "published";
            fields.publishedAt = existing.createdAt;
        }
        existing.set(fields);
        await existing.save();
        const wasOrIsPublic = existing.status === "published" || body.status === "draft";
        if (wasOrIsPublic)
            (0, publishHooks_1.notifyContentChanged)(["/blog", `/blog/${existing.slug}`]);
        res.status(200).json({ message: "Blog post updated", blogPost: toPublic(existing) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to update blog post") });
    }
};
exports.updateBlogPost = updateBlogPost;
const deleteBlogPost = async (req, res) => {
    try {
        const result = await blogPost_model_1.default.findByIdAndDelete(req.params.id);
        if (!result) {
            res.status(404).json({ error: "Blog post not found" });
            return;
        }
        (0, publishHooks_1.notifyContentChanged)();
        res.status(200).json({ message: "Blog post deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to delete blog post") });
    }
};
exports.deleteBlogPost = deleteBlogPost;
