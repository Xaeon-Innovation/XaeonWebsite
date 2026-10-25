import request from "supertest";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import type TestAgent from "supertest/lib/agent";
import { adminAgent, app, employee } from "./helpers";
import BlogPost from "../src/models/blogPost.model";
import { getUploadRoot } from "../src/config/siteUpload.config";

let admin: TestAgent;
let authorId: string;

beforeAll(async () => {
  admin = await adminAgent();
  authorId = String((await employee("Nour Writer"))._id);
});

describe("blog workflow", () => {
  it("keeps drafts private and publishes with a stable slug", async () => {
    const created = await admin.post("/api/v1/blog-post").send({
      blogPost: { title: "How to digitise HR in 2027", author: authorId, content: "## Why\n\nBecause spreadsheets break.", tags: ["HR", "hr", "Elevora"] },
    });
    expect(created.status).toBe(201);
    expect(created.body.blogPost).toMatchObject({ slug: "how-to-digitise-hr-in-2027", status: "draft", tags: ["hr", "elevora"] });
    const id = created.body.blogPost._id;

    expect((await request(app).get("/api/v1/blog-post")).body.blogPosts).toHaveLength(0);
    expect((await request(app).get("/api/v1/blog-post/slug/how-to-digitise-hr-in-2027")).status).toBe(404);
    expect((await request(app).get(`/api/v1/blog-post/${id}`)).status).toBe(404);
    expect((await admin.get("/api/v1/blog-post")).body.blogPosts).toHaveLength(1);

    const published = await admin.put("/api/v1/blog-post").send({ blogPost: { id, status: "published" } });
    expect(published.body.blogPost.publishedAt).toBeTruthy();
    const pub = await request(app).get("/api/v1/blog-post/slug/how-to-digitise-hr-in-2027");
    expect(pub.status).toBe(200);
    expect(pub.body.blogPost.excerpt).toBe("Why Because spreadsheets break.");
    expect(pub.body.blogPost.author.name).toBe("Nour Writer");
  });

  it("makes duplicate slugs unique", async () => {
    const b = await admin.post("/api/v1/blog-post").send({ blogPost: { title: "How to digitise HR in 2027", author: authorId } });
    expect(b.body.blogPost.slug).toBe("how-to-digitise-hr-in-2027-2");
  });

  it("serves legacy posts (no status/content) as published", async () => {
    const legacy = await BlogPost.collection.insertOne({ title: "Old post", description: "Plain text body.", author: authorId, createdAt: new Date("2025-05-01"), tags: [] });
    const res = await request(app).get(`/api/v1/blog-post/${legacy.insertedId}`);
    expect(res.status).toBe(200);
    expect(res.body.blogPost).toMatchObject({ status: "published", content: "Plain text body.", excerpt: "Plain text body." });
    const list = (await request(app).get("/api/v1/blog-post")).body.blogPosts.map((p: { title: string }) => p.title);
    expect(list).toContain("Old post");
  });

  it("validates payloads", async () => {
    expect((await admin.post("/api/v1/blog-post").send({ blogPost: { title: "", author: authorId } })).status).toBe(400);
    expect((await admin.post("/api/v1/blog-post").send({ blogPost: { title: "X", author: "nope" } })).status).toBe(400);
    expect((await admin.post("/api/v1/blog-post").send({ blogPost: { title: "X", author: authorId, coverImageUrl: "javascript:alert(1)" } })).status).toBe(400);
    expect((await request(app).post("/api/v1/blog-post").send({ blogPost: { title: "X" } })).status).toBe(401);
  });
});

describe("image uploads (local storage)", () => {
  it("converts to WebP, resizes for the blog and returns a public URL", async () => {
    const png = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "#72c04f" } }).png().toBuffer();
    const res = await admin.post("/api/v1/admin/site-asset").field("kind", "blog").attach("file", png, { filename: "cover.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^http:\/\/api\.test\/uploads\/site\/[0-9a-f-]+\.webp$/);
    const file = path.join(getUploadRoot(), res.body.url.split("/uploads/")[1]);
    const meta = await sharp(fs.readFileSync(file)).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 1600 });
    fs.unlinkSync(file);
  });

  it("rasterises SVG logos so stored files can't carry script", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" onload="alert(1)"><script>alert(1)</script><rect width="200" height="80"/></svg>');
    const res = await admin.post("/api/v1/admin/site-asset").field("kind", "logo").attach("file", svg, { filename: "logo.svg", contentType: "image/svg+xml" });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\.webp$/);
    const file = path.join(getUploadRoot(), res.body.url.split("/uploads/")[1]);
    expect(fs.readFileSync(file).includes("script")).toBe(false);
    fs.unlinkSync(file);
  });
});
