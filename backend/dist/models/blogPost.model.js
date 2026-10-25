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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLISHED_FILTER = exports.BLOG_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.BLOG_STATUSES = ["draft", "published"];
const BlogPostSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 120 },
    excerpt: { type: String, trim: true, maxlength: 400 },
    content: { type: String, maxlength: 100000 },
    description: { type: String },
    coverImageUrl: { type: String, trim: true },
    coverAlt: { type: String, trim: true, maxlength: 200 },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
    status: { type: String, enum: exports.BLOG_STATUSES, default: "draft" },
    publishedAt: { type: Date },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 170 },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
}, { timestamps: true });
BlogPostSchema.index({ slug: 1 }, { unique: true, sparse: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
/** Mongo filter for posts visitors may see (legacy posts have no status and are public). */
exports.PUBLISHED_FILTER = { $or: [{ status: "published" }, { status: { $exists: false } }] };
const BlogPost = mongoose_1.default.model("BlogPost", BlogPostSchema);
exports.default = BlogPost;
