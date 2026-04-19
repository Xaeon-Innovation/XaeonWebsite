"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSiteAsset = exports.uploadSiteAssetMiddleware = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const siteUpload_config_1 = require("../config/siteUpload.config");
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
        if (!["team", "case", "logo"].includes(kind)) {
            res.status(400).json({ error: "Invalid kind; use team, case, or logo" });
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
        const subdir = (0, siteUpload_config_1.getSiteUploadSubdir)();
        fs_1.default.mkdirSync(subdir, { recursive: true });
        let fileName;
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
            const txt = req.file.buffer.toString("utf8");
            (0, processSiteImage_1.assertSvgSafe)(txt);
            fileName = `${(0, crypto_1.randomUUID)()}.svg`;
            outBuf = req.file.buffer;
        }
        else {
            fileName = `${(0, crypto_1.randomUUID)()}.webp`;
            outBuf = await (0, processSiteImage_1.rasterToWebp)(req.file.buffer, kind);
        }
        const diskPath = path_1.default.join(subdir, fileName);
        fs_1.default.writeFileSync(diskPath, outBuf);
        const url = `${base}/uploads/site/${fileName}`;
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
