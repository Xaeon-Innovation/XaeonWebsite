/**
 * Moves locally stored uploads to the S3-compatible bucket and rewrites stored image URLs.
 *
 *   npx ts-node --transpile-only scripts/migrate-uploads-to-s3.ts           # dry run
 *   npx ts-node --transpile-only scripts/migrate-uploads-to-s3.ts --apply   # upload + rewrite
 *
 * Needs the S3_* env vars (see storage.ts) and API_PUBLIC_URL (the old URL prefix).
 * Safe to run twice: files are re-uploaded under the same key and already-rewritten URLs no
 * longer match the old prefix. Local files are left in place as a backup.
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

import { getUploadRoot } from "../src/config/siteUpload.config";
import { putObject, storageMode } from "../src/services/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

/** Collection → fields holding image URLs (strings, string arrays, or Markdown text). */
const URL_FIELDS: Record<string, { fields: string[]; arrays?: string[]; markdown?: string[] }> = {
  teammembers: { fields: ["photoUrl"] },
  casestudies: { fields: ["imageUrl", "logoUrl", "heroImageUrl", "dashboardImageUrl", "lifestyleImageUrl"], arrays: ["showcaseImageUrls"] },
  testimonials: { fields: ["logoUrl"] },
  blogposts: { fields: ["coverImageUrl"], markdown: ["content"] },
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  if (storageMode() !== "s3") throw new Error("S3_* env vars are not set; nothing to migrate to.");
  const oldPrefix = `${(process.env.API_PUBLIC_URL || "").replace(/\/+$/, "")}/uploads/`;
  const newPrefix = `${(process.env.S3_PUBLIC_URL || "").replace(/\/+$/, "")}/`;
  if (oldPrefix === "/uploads/") throw new Error("API_PUBLIC_URL is not set (needed to recognise old URLs).");

  const root = getUploadRoot();
  const files = walk(root).filter((f) => CONTENT_TYPES[path.extname(f).toLowerCase()]);
  console.log(`${files.length} local files under ${root}`);
  if (apply) {
    for (const f of files) {
      const key = path.relative(root, f).split(path.sep).join("/");
      await putObject(key, fs.readFileSync(f), CONTENT_TYPES[path.extname(f).toLowerCase()], "");
    }
    console.log(`Uploaded ${files.length} files.`);
  }

  if (!process.env.DB_URI) throw new Error("DB_URI is not set");
  await mongoose.connect(process.env.DB_URI);
  const swap = (v: unknown) => (typeof v === "string" && v.startsWith(oldPrefix) ? newPrefix + v.slice(oldPrefix.length) : v);
  let changedDocs = 0;
  for (const [name, spec] of Object.entries(URL_FIELDS)) {
    const col = mongoose.connection.collection(name);
    for await (const doc of col.find({})) {
      const $set: Record<string, unknown> = {};
      for (const f of spec.fields) if (swap(doc[f]) !== doc[f]) $set[f] = swap(doc[f]);
      for (const f of spec.arrays ?? []) {
        if (Array.isArray(doc[f]) && doc[f].some((v: unknown) => swap(v) !== v)) $set[f] = doc[f].map(swap);
      }
      for (const f of spec.markdown ?? []) {
        if (typeof doc[f] === "string" && doc[f].includes(oldPrefix)) $set[f] = doc[f].split(oldPrefix).join(newPrefix);
      }
      if (Object.keys($set).length) {
        changedDocs += 1;
        console.log(`${name} ${doc._id}: ${Object.keys($set).join(", ")}`);
        if (apply) await col.updateOne({ _id: doc._id }, { $set });
      }
    }
  }
  console.log(`${changedDocs} documents ${apply ? "updated" : "would change"}.${apply ? "" : " Dry run: re-run with --apply."}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await mongoose.disconnect();
  process.exit(1);
});
