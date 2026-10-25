"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageMode = storageMode;
exports.putObject = putObject;
exports.resetStorageConfig = resetStorageConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const siteUpload_config_1 = require("../config/siteUpload.config");
let cached;
function s3Config() {
    if (cached !== undefined)
        return cached;
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
        client: new client_s3_1.S3Client({
            region: process.env.S3_REGION?.trim() || "auto",
            endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
            // R2/MinIO use path-style URLs; AWS works with either.
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
            credentials: { accessKeyId, secretAccessKey },
        }),
    };
    return cached;
}
function storageMode() {
    return s3Config() ? "s3" : "local";
}
/** Stores `body` under `key` (e.g. "site/<uuid>.webp") and returns its public URL. */
async function putObject(key, body, contentType, localPublicBase) {
    const safeKey = key.replace(/^\/+/, "").replace(/\.\.+/g, ".");
    const s3 = s3Config();
    if (s3) {
        await s3.client.send(new client_s3_1.PutObjectCommand({
            Bucket: s3.bucket,
            Key: safeKey,
            Body: body,
            ContentType: contentType,
            // File names are random UUIDs, so they can be cached forever.
            CacheControl: "public, max-age=31536000, immutable",
        }));
        return `${s3.publicUrl}/${safeKey}`;
    }
    const diskPath = path_1.default.join((0, siteUpload_config_1.getUploadRoot)(), safeKey);
    fs_1.default.mkdirSync(path_1.default.dirname(diskPath), { recursive: true });
    fs_1.default.writeFileSync(diskPath, body);
    return `${localPublicBase}/uploads/${safeKey}`;
}
/** For tests: re-read env vars. */
function resetStorageConfig() {
    cached = undefined;
}
