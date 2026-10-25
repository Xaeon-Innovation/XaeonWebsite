import mongoose, { type Document, Schema } from "mongoose";

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export interface IBlogPost extends Document {
  title: string;
  /** URL path segment, unique. Older posts may not have one (the site falls back to the id). */
  slug?: string;
  /** Short summary for cards, meta descriptions and AI answers. */
  excerpt?: string;
  /** Article body in Markdown. */
  content?: string;
  /** Legacy plain-text body from the first blog version; used when `content` is empty. */
  description?: string;
  coverImageUrl?: string;
  coverAlt?: string;
  tags: string[];
  /** Missing on legacy posts, which were always public: treat as "published". */
  status?: BlogStatus;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema<IBlogPost> = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, trim: true, lowercase: true, maxlength: 120 },
  excerpt: { type: String, trim: true, maxlength: 400 },
  content: { type: String, maxlength: 100_000 },
  description: { type: String },
  coverImageUrl: { type: String, trim: true },
  coverAlt: { type: String, trim: true, maxlength: 200 },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
  status: { type: String, enum: BLOG_STATUSES, default: "draft" },
  publishedAt: { type: Date },
  seoTitle: { type: String, trim: true, maxlength: 70 },
  seoDescription: { type: String, trim: true, maxlength: 170 },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
}, { timestamps: true });

BlogPostSchema.index({ slug: 1 }, { unique: true, sparse: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });

/** Mongo filter for posts visitors may see (legacy posts have no status and are public). */
export const PUBLISHED_FILTER = { $or: [{ status: "published" }, { status: { $exists: false } }] };

const BlogPost = mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
