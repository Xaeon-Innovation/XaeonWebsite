import fs from "fs";
import path from "path";

/** Root directory for persisted uploads (subfolders under here). */
export const getUploadRoot = (): string => {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  return path.join(process.cwd(), "uploads");
};

export const getSiteUploadSubdir = (): string => path.join(getUploadRoot(), "site");

export function ensureSiteUploadDir(): void {
  const dir = getSiteUploadSubdir();
  fs.mkdirSync(dir, { recursive: true });
}

/** Base URL for files under /uploads (no trailing slash). Used in stored photoUrl/imageUrl. */
export function getUploadPublicBase(req?: { protocol?: string; get?: (h: string) => string | undefined }): string {
  const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "").trim();
  if (env) return env;
  if (req?.get) {
    const xfProto = req.get("x-forwarded-proto");
    const proto = (typeof xfProto === "string" ? xfProto.split(",")[0].trim() : "") || req.protocol || "https";
    const host = req.get("x-forwarded-host") || req.get("host");
    if (host) return `${proto}://${host}`;
  }
  return "";
}
