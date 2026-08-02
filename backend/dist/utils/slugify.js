"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.isValidSlug = isValidSlug;
/** Lowercase kebab-case slug from a title or raw string. */
function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function isValidSlug(slug) {
    return SLUG_RE.test(slug) && slug.length >= 1 && slug.length <= 80;
}
