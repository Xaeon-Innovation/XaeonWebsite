import type { Request, Response } from "express";
import mongoose from "mongoose";
import BlogPost, { BLOG_STATUSES, type BlogStatus, type IBlogPost, PUBLISHED_FILTER } from "../models/blogPost.model";
import Employee from "../models/employee.model";
import { notifyContentChanged } from "../services/publishHooks";
import { serverErrorMessage } from "../utils/serverError";

/** Latin + Arabic letters and digits, hyphen-separated. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "post";
  for (let i = 1; i < 200; i += 1) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const clash = await BlogPost.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function excerptFrom(markdown: string): string {
  const plain = markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 200 ? `${plain.slice(0, 197).replace(/\s+\S*$/, "")}…` : plain;
}

/** Shape sent to clients: legacy posts get content/excerpt/status/publishedAt filled in. */
function toPublic(post: unknown) {
  const doc = post as { toObject?: () => unknown };
  const p = (typeof doc.toObject === "function" ? doc.toObject() : post) as Partial<IBlogPost> & Record<string, unknown>;
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

function isAdmin(req: Request): boolean {
  return req.user?.role === "admin";
}

const optStr = (v: unknown, max: number): string | undefined =>
  typeof v === "string" ? v.trim().slice(0, max) : undefined;

/** Whitelisted, validated fields from an admin payload. */
async function readPayload(body: Record<string, unknown>, existing?: IBlogPost): Promise<{ fields: Partial<IBlogPost>; error?: string }> {
  const fields: Partial<IBlogPost> = {};
  const title = optStr(body.title, 200);
  if (title !== undefined) {
    if (!title) return { fields, error: "Title is required" };
    fields.title = title;
  }
  for (const [key, max] of [["excerpt", 400], ["coverImageUrl", 500], ["coverAlt", 200], ["seoTitle", 70], ["seoDescription", 170]] as const) {
    const v = optStr(body[key], max);
    if (v !== undefined) (fields as Record<string, unknown>)[key] = v;
  }
  if (typeof body.content === "string") fields.content = body.content.slice(0, 100_000);
  // Only web URLs (blocks javascript:, data: …); http is allowed for local development.
  if (fields.coverImageUrl && !/^https?:\/\//.test(fields.coverImageUrl)) return { fields, error: "Cover image must be a web (http/https) URL" };
  if (Array.isArray(body.tags)) {
    fields.tags = [...new Set(body.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
  }
  if (body.author !== undefined) {
    if (typeof body.author !== "string" || !mongoose.Types.ObjectId.isValid(body.author) || !(await Employee.exists({ _id: body.author }))) {
      return { fields, error: "Choose an author" };
    }
    fields.author = new mongoose.Types.ObjectId(body.author);
  }
  if (body.status !== undefined) {
    if (!(BLOG_STATUSES as readonly unknown[]).includes(body.status)) return { fields, error: "Invalid status" };
    fields.status = body.status as BlogStatus;
    // First publish stamps the date; republishing keeps the original.
    if (fields.status === "published" && !existing?.publishedAt) fields.publishedAt = new Date();
  }
  if (body.slug !== undefined) {
    const s = slugify(String(body.slug ?? ""));
    fields.slug = s ? await uniqueSlug(s, existing ? String(existing._id) : undefined) : undefined;
  }
  return { fields };
}

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = isAdmin(req) ? {} : { ...PUBLISHED_FILTER };
    if (typeof req.query.tag === "string" && req.query.tag.trim()) filter.tags = req.query.tag.trim().toLowerCase();
    const blogPosts = await BlogPost.find(filter)
      .select(isAdmin(req) ? "" : "-description")
      .populate("author", "name")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    res.status(200).json({ blogPosts: blogPosts.map(toPublic) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch blog posts") });
  }
};

export const getBlogPostById = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    const blogPost = await BlogPost.findOne({ _id: req.params.id, ...(isAdmin(req) ? {} : PUBLISHED_FILTER) })
      .populate("author", "name")
      .lean();
    if (!blogPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    res.status(200).json({ blogPost: toPublic(blogPost) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch blog post") });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug ?? "").trim().toLowerCase().slice(0, 120);
    const blogPost = await BlogPost.findOne({ slug, ...PUBLISHED_FILTER }).populate("author", "name").lean();
    if (!blogPost) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    res.status(200).json({ blogPost: toPublic(blogPost) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch blog post") });
  }
};

export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const body = (req.body?.blogPost ?? {}) as Record<string, unknown>;
    const { fields, error } = await readPayload(body);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    if (!fields.title || !fields.author) {
      res.status(400).json({ error: "Title and author are required" });
      return;
    }
    if (!fields.slug) fields.slug = await uniqueSlug(slugify(fields.title));
    const blogPost = await BlogPost.create({ status: "draft", ...fields });
    if (blogPost.status === "published") notifyContentChanged(["/blog", `/blog/${blogPost.slug}`]);
    res.status(201).json({ message: "Blog post created", blogPost: toPublic(blogPost) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to create blog post") });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const body = (req.body?.blogPost ?? {}) as Record<string, unknown>;
    const id = body.id;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Blog post id is required" });
      return;
    }
    const existing = await BlogPost.findById(id);
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
    if (!existing.content && existing.description && fields.content === undefined) fields.content = existing.description;
    if (!existing.slug && !fields.slug) fields.slug = await uniqueSlug(slugify(fields.title ?? existing.title), id);
    if (!existing.status && !fields.status) {
      fields.status = "published";
      fields.publishedAt = existing.createdAt;
    }
    existing.set(fields);
    await existing.save();
    const wasOrIsPublic = existing.status === "published" || body.status === "draft";
    if (wasOrIsPublic) notifyContentChanged(["/blog", `/blog/${existing.slug}`]);
    res.status(200).json({ message: "Blog post updated", blogPost: toPublic(existing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to update blog post") });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const result = await BlogPost.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    notifyContentChanged();
    res.status(200).json({ message: "Blog post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to delete blog post") });
  }
};
