"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteUploadSubdir = exports.getUploadRoot = void 0;
exports.ensureSiteUploadDir = ensureSiteUploadDir;
exports.getUploadPublicBase = getUploadPublicBase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** Root directory for persisted uploads (subfolders under here). */
const getUploadRoot = () => {
    const fromEnv = process.env.UPLOAD_DIR?.trim();
    if (fromEnv)
        return path_1.default.isAbsolute(fromEnv) ? fromEnv : path_1.default.resolve(process.cwd(), fromEnv);
    return path_1.default.join(process.cwd(), "uploads");
};
exports.getUploadRoot = getUploadRoot;
const getSiteUploadSubdir = () => path_1.default.join((0, exports.getUploadRoot)(), "site");
exports.getSiteUploadSubdir = getSiteUploadSubdir;
function ensureSiteUploadDir() {
    const dir = (0, exports.getSiteUploadSubdir)();
    fs_1.default.mkdirSync(dir, { recursive: true });
}
/** Base URL for files under /uploads (no trailing slash). Used in stored photoUrl/imageUrl. */
function getUploadPublicBase(req) {
    const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "").trim();
    if (env)
        return env;
    if (req?.get) {
        const xfProto = req.get("x-forwarded-proto");
        const proto = (typeof xfProto === "string" ? xfProto.split(",")[0].trim() : "") || req.protocol || "https";
        const host = req.get("x-forwarded-host") || req.get("host");
        if (host)
            return `${proto}://${host}`;
    }
    return "";
}
