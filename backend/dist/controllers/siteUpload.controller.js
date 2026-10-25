"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSiteAsset = exports.uploadSiteAssetMiddleware = void 0;
const crypto_1 = require("crypto");
const multer_1 = __importDefault(require("multer"));
const siteUpload_config_1 = require("../config/siteUpload.config");
const storage_1 = require("../services/storage");
const processSiteImage_1 = require("../utils/processSiteImage");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.mimetype);
        cb(null, ok);
    },
});
exports.uploadSiteAssetMiddleware = upload.single("file");
const uploadSiteAsset = async (req, res) => {
    try {
        const kind = String(req.body?.kind ?? "case");
        if (!["team", "case", "logo", "blog"].includes(kind)) {
            res.status(400).json({ error: "Invalid kind; use team, case, logo, or blog" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: "Missing file" });
            return;
        }
        const base = (0, siteUpload_config_1.getUploadPublicBase)(req);
        if (!base) {
            res.status(500).json({
                error: "Set API_PUBLIC_URL in .env (e.g. https://api.xaeons.com) so uploaded files get a stable public URL.",
            });
            return;
        }
        let outBuf;
        if (req.file.mimetype === "image/svg+xml") {
            if (kind !== "logo") {
                res.status(400).json({ error: "SVG is only allowed for logo uploads (kind=logo)" });
                return;
            }
            if (req.file.size > processSiteImage_1.MAX_SVG_BYTES) {
                res.status(400).json({ error: "SVG too large (max 200KB)" });
                return;
            }
            // Rasterize instead of serving the SVG: stored SVG can carry script (stored XSS).
            outBuf = await (0, processSiteImage_1.rasterToWebp)(req.file.buffer, "logo");
        }
        else {
            outBuf = await (0, processSiteImage_1.rasterToWebp)(req.file.buffer, kind);
        }
        const url = await (0, storage_1.putObject)(`site/${(0, crypto_1.randomUUID)()}.webp`, outBuf, "image/webp", base);
        res.status(200).json({ url });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
};
exports.uploadSiteAsset = uploadSiteAsset;
