import type { Request, Response } from "express";
import Star from "../models/star.model";
import { serverErrorMessage } from "../utils/serverError";

/** Public: published clients for the website's galaxy of stars (admin CRUD lives in builderAdmin.controller.ts). */
export const getPublicStars = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stars = await Star.find({ published: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("name logoUrl industry product constellation country since magnitude highlight caseStudy url")
      .populate({ path: "caseStudy", select: "slug title -_id", match: { published: true } })
      .lean();
    res.status(200).json({ stars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch stars") });
  }
};
