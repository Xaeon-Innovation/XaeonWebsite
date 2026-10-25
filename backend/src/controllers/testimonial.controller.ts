import type { Request, Response } from "express";
import Testimonial from "../models/testimonial.model";
import { serverErrorMessage } from "../utils/serverError";

function optStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Whitelisted fields only (no mass assignment). */
function toFields(body: Record<string, unknown>) {
  return {
    ...(typeof body.quote === "string" ? { quote: body.quote.trim() } : {}),
    ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
    ...("role" in body ? { role: optStr(body.role) ?? "" } : {}),
    ...("company" in body ? { company: optStr(body.company) ?? "" } : {}),
    ...("logoUrl" in body ? { logoUrl: optStr(body.logoUrl) ?? "" } : {}),
    ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
    ...(typeof body.published === "boolean" ? { published: body.published } : {}),
  };
}

export const getTestimonials = async (_req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find().sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ testimonials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch testimonials") });
  }
};

/** Public: published testimonials for the website. */
export const getPublicTestimonials = async (_req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({ published: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("quote name role company logoUrl")
      .lean();
    res.status(200).json({ testimonials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch testimonials") });
  }
};

export const createTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.testimonial as Record<string, unknown> | undefined;
    if (!body || typeof body.quote !== "string" || typeof body.name !== "string") {
      res.status(400).json({ error: "testimonial with quote and name is required" });
      return;
    }
    const testimonial = await Testimonial.create(toFields(body));
    res.status(201).json({ message: "Testimonial created", testimonial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to create testimonial") });
  }
};

export const updateTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.testimonial as Record<string, unknown> | undefined;
    const id = body?.id;
    if (!body || typeof id !== "string") {
      res.status(400).json({ error: "testimonial.id is required" });
      return;
    }
    const testimonial = await Testimonial.findByIdAndUpdate(id, toFields(body), {
      new: true,
      runValidators: true,
    });
    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    res.status(200).json({ message: "Testimonial updated", testimonial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to update testimonial") });
  }
};

export const deleteTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await Testimonial.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    res.status(200).json({ message: "Testimonial deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to delete testimonial") });
  }
};
