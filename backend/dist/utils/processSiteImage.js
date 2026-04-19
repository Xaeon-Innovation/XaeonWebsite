"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SVG_BYTES = void 0;
exports.assertRasterSize = assertRasterSize;
exports.rasterToWebp = rasterToWebp;
exports.assertSvgSafe = assertSvgSafe;
const sharp_1 = __importDefault(require("sharp"));
const MAX_BYTES = 10 * 1024 * 1024;
function assertRasterSize(buffer) {
    if (buffer.length > MAX_BYTES) {
        throw new Error("File too large (max 10MB)");
    }
}
/** Raster images → WebP on disk. Dimensions tuned for storage vs quality. */
async function rasterToWebp(buffer, kind) {
    assertRasterSize(buffer);
    let img = (0, sharp_1.default)(buffer).rotate();
    const maxEdge = kind === "case" ? 2560 : kind === "team" ? 1200 : 512;
    const quality = kind === "case" ? 78 : kind === "team" ? 80 : 85;
    img = img.resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
    });
    return img.webp({ quality, effort: 4 }).toBuffer();
}
function assertSvgSafe(svgText) {
    const lower = svgText.toLowerCase();
    if (lower.includes("<script") ||
        lower.includes("javascript:") ||
        lower.includes("onload=") ||
        lower.includes("onerror=")) {
        throw new Error("SVG contains disallowed content");
    }
}
exports.MAX_SVG_BYTES = 200 * 1024;
