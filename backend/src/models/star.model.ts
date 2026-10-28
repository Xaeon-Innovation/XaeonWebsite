import mongoose, { type Document, Schema } from "mongoose";

/**
 * A client shown in the website's "galaxy of stars" (see docs/website-builder/galaxy.md).
 * Stars are grouped into constellations, by default the product the client uses.
 */
export const STAR_PRODUCTS = ["website", "app", "polara", "velora", "custom"] as const;
export type StarProduct = (typeof STAR_PRODUCTS)[number];

export interface IStar extends Document {
  name: string;
  logoUrl?: string;
  industry?: string;
  product: StarProduct;
  /** Optional override of the constellation group (defaults to `product`). */
  constellation?: string;
  country?: string;
  since?: number;
  /** 1–3: brighter, bigger stars for flagship clients. */
  magnitude: number;
  /** One-line result or quote shown on the star card. */
  highlight?: string;
  caseStudy?: mongoose.Types.ObjectId;
  url?: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StarSchema = new Schema<IStar>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    logoUrl: { type: String, trim: true },
    industry: { type: String, trim: true, maxlength: 80 },
    product: { type: String, enum: STAR_PRODUCTS, default: "website" },
    constellation: { type: String, trim: true, maxlength: 40 },
    country: { type: String, trim: true, maxlength: 60 },
    since: { type: Number, min: 2000, max: 2100 },
    magnitude: { type: Number, min: 1, max: 3, default: 1 },
    highlight: { type: String, trim: true, maxlength: 200 },
    caseStudy: { type: Schema.Types.ObjectId, ref: "CaseStudy" },
    url: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StarSchema.index({ published: 1, sortOrder: 1 });

const Star = mongoose.model<IStar>("Star", StarSchema);

export default Star;
