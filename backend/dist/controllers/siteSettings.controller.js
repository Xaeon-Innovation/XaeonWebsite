"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putAdminSiteSettings = exports.getAdminSiteSettings = exports.getPublicSocialLinks = void 0;
const siteSettings_model_1 = __importDefault(require("../models/siteSettings.model"));
const SINGLETON = "default";
const emptySocial = {
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    emailUrl: "mailto:info@xaeons.com",
};
function isAllowedUrlOrEmpty(s) {
    const t = s.trim();
    if (t === "")
        return true;
    if (/^mailto:/i.test(t)) {
        try {
            const u = new URL(t);
            return u.protocol === "mailto:";
        }
        catch {
            return false;
        }
    }
    try {
        const u = new URL(t);
        return u.protocol === "https:" || u.protocol === "http:";
    }
    catch {
        return false;
    }
}
function normalizeEmailField(raw) {
    const t = raw.trim();
    if (t === "")
        return "";
    if (/^mailto:/i.test(t) || /^https?:\/\//i.test(t))
        return t;
    if (t.includes("@") && !/\s/.test(t))
        return `mailto:${t}`;
    return t;
}
function toPublicShape(doc) {
    if (!doc) {
        return { ...emptySocial };
    }
    return {
        facebookUrl: doc.facebookUrl ?? "",
        instagramUrl: doc.instagramUrl ?? "",
        linkedinUrl: doc.linkedinUrl ?? "",
        twitterUrl: doc.twitterUrl ?? "",
        emailUrl: (doc.emailUrl ?? "").trim(),
    };
}
/** Public — footer social icons */
const getPublicSocialLinks = async (_req, res) => {
    try {
        const doc = await siteSettings_model_1.default.findOne({ singletonKey: SINGLETON }).lean();
        res.status(200).json({ socialLinks: toPublicShape(doc) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load site settings",
        });
    }
};
exports.getPublicSocialLinks = getPublicSocialLinks;
/** Admin — load form */
const getAdminSiteSettings = async (_req, res) => {
    try {
        let doc = await siteSettings_model_1.default.findOne({ singletonKey: SINGLETON }).lean();
        if (!doc) {
            await siteSettings_model_1.default.create({ singletonKey: SINGLETON, ...emptySocial });
            doc = await siteSettings_model_1.default.findOne({ singletonKey: SINGLETON }).lean();
        }
        res.status(200).json({ siteSettings: toPublicShape(doc) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to load site settings",
        });
    }
};
exports.getAdminSiteSettings = getAdminSiteSettings;
/** Admin — save social URLs */
const putAdminSiteSettings = async (req, res) => {
    try {
        const body = req.body?.siteSettings;
        if (!body || typeof body !== "object") {
            res.status(400).json({ error: "siteSettings object is required" });
            return;
        }
        const keys = ["facebookUrl", "instagramUrl", "linkedinUrl", "twitterUrl", "emailUrl"];
        const next = {};
        for (const k of keys) {
            const v = typeof body[k] === "string" ? body[k].trim() : "";
            const normalized = k === "emailUrl" ? normalizeEmailField(v) : v;
            if (k !== "emailUrl" && normalized !== "" && !isAllowedUrlOrEmpty(normalized)) {
                res.status(400).json({ error: `Invalid URL for ${k}` });
                return;
            }
            if (k === "emailUrl" && normalized !== "" && !isAllowedUrlOrEmpty(normalized)) {
                res.status(400).json({ error: "Invalid email or mailto URL" });
                return;
            }
            next[k] = normalized;
        }
        const doc = await siteSettings_model_1.default.findOneAndUpdate({ singletonKey: SINGLETON }, { $set: next }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, lean: true });
        res.status(200).json({ message: "Saved", siteSettings: toPublicShape(doc) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to save site settings",
        });
    }
};
exports.putAdminSiteSettings = putAdminSiteSettings;
