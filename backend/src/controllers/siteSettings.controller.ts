import type { Request, Response } from "express";
import SiteSettings from "../models/siteSettings.model";

const SINGLETON = "default";

const emptySocial = {
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  emailUrl: "mailto:info@xaeons.com",
};

function isAllowedUrlOrEmpty(s: string): boolean {
  const t = s.trim();
  if (t === "") return true;
  if (/^mailto:/i.test(t)) {
    try {
      const u = new URL(t);
      return u.protocol === "mailto:";
    } catch {
      return false;
    }
  }
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeEmailField(raw: string): string {
  const t = raw.trim();
  if (t === "") return "";
  if (/^mailto:/i.test(t) || /^https?:\/\//i.test(t)) return t;
  if (t.includes("@") && !/\s/.test(t)) return `mailto:${t}`;
  return t;
}

function toPublicShape(doc: {
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  emailUrl?: string;
} | null) {
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
export const getPublicSocialLinks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const doc = await SiteSettings.findOne({ singletonKey: SINGLETON }).lean();
    res.status(200).json({ socialLinks: toPublicShape(doc) });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to load site settings",
    });
  }
};

/** Admin — load form */
export const getAdminSiteSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    let doc = await SiteSettings.findOne({ singletonKey: SINGLETON }).lean();
    if (!doc) {
      await SiteSettings.create({ singletonKey: SINGLETON, ...emptySocial });
      doc = await SiteSettings.findOne({ singletonKey: SINGLETON }).lean();
    }
    res.status(200).json({ siteSettings: toPublicShape(doc) });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to load site settings",
    });
  }
};

/** Admin — save social URLs */
export const putAdminSiteSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.siteSettings as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "siteSettings object is required" });
      return;
    }

    const keys = ["facebookUrl", "instagramUrl", "linkedinUrl", "twitterUrl", "emailUrl"] as const;
    const next: Record<string, string> = {};

    for (const k of keys) {
      const v = typeof body[k] === "string" ? (body[k] as string).trim() : "";
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

    const doc = await SiteSettings.findOneAndUpdate(
      { singletonKey: SINGLETON },
      { $set: next },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, lean: true }
    );

    res.status(200).json({ message: "Saved", siteSettings: toPublicShape(doc) });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to save site settings",
    });
  }
};
