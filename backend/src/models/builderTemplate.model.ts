import mongoose, { type Document, Schema } from "mongoose";
import {
  BUILDER_CATEGORIES,
  LocalizedSchema,
  PLAN_TIERS,
  TEMPLATE_LAYOUTS,
  type BuilderCategory,
  type Localized,
  type PlanTier,
  type TemplateLayout,
} from "./builderShared";

export interface IBuilderTemplate extends Document {
  slug: string;
  category: BuilderCategory;
  name: Localized;
  tagline: Localized;
  /** Optional screenshot; without it the website renders a live mock in this layout. */
  previewImageUrl?: string;
  /** Drives the website's live preview renderer. */
  layout: TemplateLayout;
  defaultBrand: { primary: string; accent: string; font: string };
  /** Page names included, e.g. Home, Services, Doctors, Book. */
  pages: Localized[];
  features: Localized[];
  /** Add-on keys suggested with this template. */
  recommendedAddons: string[];
  minPlan: PlanTier;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BuilderTemplateSchema = new Schema<IBuilderTemplate>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, enum: BUILDER_CATEGORIES, required: true },
    name: { type: LocalizedSchema, required: true },
    tagline: { type: LocalizedSchema, default: () => ({}) },
    previewImageUrl: { type: String, trim: true },
    layout: { type: String, enum: TEMPLATE_LAYOUTS, default: "classic" },
    defaultBrand: {
      primary: { type: String, trim: true, default: "#72c04f" },
      accent: { type: String, trim: true, default: "#1b3d50" },
      font: { type: String, trim: true, default: "modern" },
    },
    pages: { type: [LocalizedSchema], default: [] },
    features: { type: [LocalizedSchema], default: [] },
    recommendedAddons: { type: [String], default: [] },
    minPlan: { type: String, enum: PLAN_TIERS, default: "launch" },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BuilderTemplateSchema.index({ published: 1, sortOrder: 1 });
BuilderTemplateSchema.index({ slug: 1 }, { unique: true });

const BuilderTemplate = mongoose.model<IBuilderTemplate>("BuilderTemplate", BuilderTemplateSchema);

export default BuilderTemplate;
