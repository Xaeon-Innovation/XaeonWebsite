import fs from "fs";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getUploadRoot } from "../config/siteUpload.config";

/**
 * Where uploaded images live. With S3_* env vars set (Cloudflare R2, AWS S3, Backblaze B2,
 * MinIO…) files go to the bucket and survive server rebuilds; otherwise they're written to
 * the local uploads/ folder and served by Express, as before.
 */
type S3Config = { bucket: string; publicUrl: string; client: S3Client };

let cached: S3Config | null | undefined;

function s3Config(): S3Config | null {
  if (cached !== undefined) return cached;
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const publicUrl = process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!bucket || !accessKeyId || !secretAccessKey || !publicUrl) {
    cached = null;
    return cached;
  }
  cached = {
    bucket,
    publicUrl,
    client: new S3Client({
      region: process.env.S3_REGION?.trim() || "auto",
      endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
      // R2/MinIO use path-style URLs; AWS works with either.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
  return cached;
}

export function storageMode(): "s3" | "local" {
  return s3Config() ? "s3" : "local";
}

/** Stores `body` under `key` (e.g. "site/<uuid>.webp") and returns its public URL. */
export async function putObject(key: string, body: Buffer, contentType: string, localPublicBase: string): Promise<string> {
  const safeKey = key.replace(/^\/+/, "").replace(/\.\.+/g, ".");
  const s3 = s3Config();
  if (s3) {
    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: safeKey,
        Body: body,
        ContentType: contentType,
        // File names are random UUIDs, so they can be cached forever.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${s3.publicUrl}/${safeKey}`;
  }
  const diskPath = path.join(getUploadRoot(), safeKey);
  fs.mkdirSync(path.dirname(diskPath), { recursive: true });
  fs.writeFileSync(diskPath, body);
  return `${localPublicBase}/uploads/${safeKey}`;
}

/** For tests: re-read env vars. */
export function resetStorageConfig(): void {
  cached = undefined;
}
