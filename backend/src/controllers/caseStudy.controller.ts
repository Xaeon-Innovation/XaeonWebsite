import type { Request, Response } from "express";
import CaseStudy from "../models/caseStudy.model";

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
    const created = await CaseStudy.create({
      title: p.title.trim(),
      subtitle: p.subtitle.trim(),
      description: p.description.trim(),
      imageUrl: p.imageUrl.trim(),
      logoUrl: typeof p.logoUrl === "string" && p.logoUrl.trim() ? p.logoUrl.trim() : undefined,
      exploreHref: typeof p.exploreHref === "string" && p.exploreHref.trim() ? p.exploreHref.trim() : undefined,
      exploreLabel: typeof p.exploreLabel === "string" && p.exploreLabel.trim() ? p.exploreLabel.trim() : undefined,
      sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : 0,
      published: Boolean(p.published),
    });
    res.status(200).json({ message: "Case study created", caseStudy: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create case study",
    });
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
    if (body.logoUrl !== undefined) {
      patch.logoUrl =
        typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : null;
    }
    if (body.exploreHref !== undefined) {
      patch.exploreHref =
        typeof body.exploreHref === "string" && body.exploreHref.trim() ? body.exploreHref.trim() : null;
    }
    if (body.exploreLabel !== undefined) {
      patch.exploreLabel =
        typeof body.exploreLabel === "string" && body.exploreLabel.trim()
          ? body.exploreLabel.trim()
          : null;
    }
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
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update case study",
    });
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
