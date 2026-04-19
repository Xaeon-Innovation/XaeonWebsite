import type { Request, Response } from "express";
import TeamMember from "../models/teamMember.model";
import CaseStudy from "../models/caseStudy.model";

/** Public: published team members for About page */
export const getPublicTeamMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const members = await TeamMember.find({ published: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    res.status(200).json({ teamMembers: members });
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

    const slides = rows.map((doc) => ({
      id: String(doc._id),
      imageSrc: doc.imageUrl,
      logoSrc: doc.logoUrl || undefined,
      title: doc.title,
      subtitle: doc.subtitle,
      description: doc.description,
      exploreHref: doc.exploreHref || undefined,
      exploreLabel: doc.exploreLabel || undefined,
    }));

    res.status(200).json({ slides });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch case studies",
    });
  }
};
