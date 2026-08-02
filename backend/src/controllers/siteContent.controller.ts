import type { Request, Response } from "express";
import TeamMember from "../models/teamMember.model";
import CaseStudy from "../models/caseStudy.model";
import SiteSettings from "../models/siteSettings.model";

/** Public: published team members for About page */
export const getPublicTeamMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [members, settings] = await Promise.all([
      TeamMember.find({ published: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
      SiteSettings.findOne({ singletonKey: "default" }).lean(),
    ]);
    res.status(200).json({
      teamMembers: members,
      showSection: settings?.showTeamSection !== false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch team",
    });
  }
};

/** Public: published case studies shaped for CaseSlider */
export const getPublicCaseStudies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await CaseStudy.find({ published: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    const slides = rows.map((doc) => {
      const slug = typeof doc.slug === "string" && doc.slug ? doc.slug : undefined;
      const exploreHref =
        (typeof doc.exploreHref === "string" && doc.exploreHref.trim()) ||
        (slug ? `/case-studies/${slug}` : undefined);

      return {
        id: String(doc._id),
        slug,
        imageSrc: doc.imageUrl,
        logoSrc: doc.logoUrl || undefined,
        title: doc.title,
        subtitle: doc.subtitle,
        description: doc.description,
        exploreHref,
        exploreLabel: doc.exploreLabel || undefined,
      };
    });

    res.status(200).json({ slides });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch case studies",
    });
  }
};

/** Public: single published case study by slug */
export const getPublicCaseStudyBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = typeof req.params.slug === "string" ? req.params.slug.trim().toLowerCase() : "";
    if (!slug) {
      res.status(400).json({ error: "slug is required" });
      return;
    }

    const caseStudy = await CaseStudy.findOne({ slug, published: true }).lean();
    if (!caseStudy) {
      res.status(404).json({ error: "Case study not found" });
      return;
    }

    res.status(200).json({ caseStudy });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch case study",
    });
  }
};
