import type { Request, Response } from "express";
import CaseStudy from "../models/caseStudy.model";
import { isValidSlug, slugify } from "../utils/slugify";

function optStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

function optStrOrNull(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function parseStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStats(v: unknown): { value: string; label: string }[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: { value: string; label: string }[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const value = typeof row.value === "string" ? row.value.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (value && label) out.push({ value, label });
  }
  return out;
}

function resolveSlug(raw: unknown, titleFallback: string): string | null {
  const fromBody = typeof raw === "string" ? slugify(raw) : "";
  const fromTitle = slugify(titleFallback);
  const slug = fromBody || fromTitle;
  if (!slug || !isValidSlug(slug)) return null;
  return slug;
}

export const getCaseStudies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const caseStudies = await CaseStudy.find().sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ caseStudies });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch case studies",
    });
  }
};

export const createCaseStudy = async (req: Request, res: Response): Promise<void> => {
  try {
    const p = req.body?.caseStudy as Record<string, unknown> | undefined;
    if (!p || typeof p.title !== "string" || typeof p.subtitle !== "string" || typeof p.description !== "string") {
      res.status(400).json({ error: "caseStudy requires title, subtitle, description" });
      return;
    }
    if (typeof p.imageUrl !== "string" || !p.imageUrl.trim()) {
      res.status(400).json({ error: "imageUrl is required" });
      return;
    }
    const slug = resolveSlug(p.slug, p.title);
    if (!slug) {
      res.status(400).json({ error: "Valid slug is required (lowercase kebab-case)" });
      return;
    }

    const existing = await CaseStudy.findOne({ slug }).lean();
    if (existing) {
      res.status(400).json({ error: "A case study with this slug already exists" });
      return;
    }

    const created = await CaseStudy.create({
      title: p.title.trim(),
      subtitle: p.subtitle.trim(),
      description: p.description.trim(),
      imageUrl: p.imageUrl.trim(),
      logoUrl: optStr(p.logoUrl),
      slug,
      heroTitle: optStr(p.heroTitle),
      heroSubtitle: optStr(p.heroSubtitle),
      heroImageUrl: optStr(p.heroImageUrl),
      introText: optStr(p.introText),
      showcaseImageUrls: parseStringArray(p.showcaseImageUrls) ?? [],
      dashboardImageUrl: optStr(p.dashboardImageUrl),
      narrativeBefore: optStr(p.narrativeBefore),
      lifestyleImageUrl: optStr(p.lifestyleImageUrl),
      narrativeAfter: optStr(p.narrativeAfter),
      stats: parseStats(p.stats) ?? [],
      exploreHref: optStr(p.exploreHref),
      exploreLabel: optStr(p.exploreLabel),
      sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : 0,
      published: Boolean(p.published),
    });
    res.status(200).json({ message: "Case study created", caseStudy: created });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Failed to create case study";
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      res.status(400).json({ error: "A case study with this slug already exists" });
      return;
    }
    res.status(500).json({ error: msg });
  }
};

export const updateCaseStudy = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.caseStudy as Record<string, unknown> | undefined;
    const id = body?.id;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "caseStudy.id is required" });
      return;
    }
    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.subtitle === "string") patch.subtitle = body.subtitle.trim();
    if (typeof body.description === "string") patch.description = body.description.trim();
    if (typeof body.imageUrl === "string") patch.imageUrl = body.imageUrl.trim();
    if (body.logoUrl !== undefined) patch.logoUrl = optStrOrNull(body.logoUrl);

    if (body.slug !== undefined) {
      const slug =
        typeof body.slug === "string" ? slugify(body.slug) : "";
      if (!slug || !isValidSlug(slug)) {
        res.status(400).json({ error: "Valid slug is required (lowercase kebab-case)" });
        return;
      }
      const clash = await CaseStudy.findOne({ slug, _id: { $ne: id } }).lean();
      if (clash) {
        res.status(400).json({ error: "A case study with this slug already exists" });
        return;
      }
      patch.slug = slug;
    }

    if (body.heroTitle !== undefined) patch.heroTitle = optStrOrNull(body.heroTitle);
    if (body.heroSubtitle !== undefined) patch.heroSubtitle = optStrOrNull(body.heroSubtitle);
    if (body.heroImageUrl !== undefined) patch.heroImageUrl = optStrOrNull(body.heroImageUrl);
    if (body.introText !== undefined) patch.introText = optStrOrNull(body.introText);
    if (body.showcaseImageUrls !== undefined) {
      patch.showcaseImageUrls = parseStringArray(body.showcaseImageUrls) ?? [];
    }
    if (body.dashboardImageUrl !== undefined) {
      patch.dashboardImageUrl = optStrOrNull(body.dashboardImageUrl);
    }
    if (body.narrativeBefore !== undefined) patch.narrativeBefore = optStrOrNull(body.narrativeBefore);
    if (body.lifestyleImageUrl !== undefined) {
      patch.lifestyleImageUrl = optStrOrNull(body.lifestyleImageUrl);
    }
    if (body.narrativeAfter !== undefined) patch.narrativeAfter = optStrOrNull(body.narrativeAfter);
    if (body.stats !== undefined) patch.stats = parseStats(body.stats) ?? [];

    if (body.exploreHref !== undefined) patch.exploreHref = optStrOrNull(body.exploreHref);
    if (body.exploreLabel !== undefined) patch.exploreLabel = optStrOrNull(body.exploreLabel);
    if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
    if (typeof body.published === "boolean") patch.published = body.published;

    const updated = await CaseStudy.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ error: "Case study not found" });
      return;
    }
    res.status(200).json({ message: "Case study updated", caseStudy: updated });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Failed to update case study";
    if (msg.includes("duplicate key") || msg.includes("E11000")) {
      res.status(400).json({ error: "A case study with this slug already exists" });
      return;
    }
    res.status(500).json({ error: msg });
  }
};

export const deleteCaseStudy = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CaseStudy.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Case study not found" });
      return;
    }
    res.status(200).json({ message: "Case study deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete case study",
    });
  }
};
