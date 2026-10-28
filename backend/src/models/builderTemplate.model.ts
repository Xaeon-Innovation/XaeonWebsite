import mongoose, { type Document, Schema } from "mongoose";
import {
  BUILDER_CATEGORIES,
  CORNER_STYLES,
  HERO_STYLES,
  LocalizedSchema,
  PAGE_KEYS,
  PLAN_TIERS,
  TEMPLATE_LAYOUTS,
  THEME_MODES,
  type BuilderCategory,
  type CornerStyle,
  type HeroStyle,
  type Localized,
  type PageKey,
  type PlanTier,
  type TemplateLayout,
  type ThemeMode,
} from "./builderShared";

export interface IBuilderTemplate extends Document {
  slug: string;
  category: BuilderCategory;
  name: Localized;
  tagline: Localized;
  /** Optional screenshot; without it the website renders a live mock in this layout. */
  previewImageUrl?: string;
  /** Look, rendered live by the website's preview. */
  layout: TemplateLayout;
  hero: HeroStyle;
  mode: ThemeMode;
  corners: CornerStyle;
  defaultBrand: { primary: string; accent: string; font: string };
  /** Pages the customer can choose from (page library keys), in menu order. */
  pageKeys: PageKey[];
  /** Pre-selected pages (a subset of pageKeys; "home" is always included). */
  defaultPages: PageKey[];
  /** Short style tags for filtering, e.g. "Elegant", "Bold". */
  tags: Localized[];
  /** Goals this design is built around (calls, bookings, leads, sales, catalogue). */
  goals: string[];
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
    hero: { type: String, enum: HERO_STYLES, default: "split" },
    mode: { type: String, enum: THEME_MODES, default: "light" },
    corners: { type: String, enum: CORNER_STYLES, default: "soft" },
    defaultBrand: {
      primary: { type: String, trim: true, default: "#72c04f" },
      accent: { type: String, trim: true, default: "#1b3d50" },
      font: { type: String, trim: true, default: "modern" },
    },
    pageKeys: { type: [String], enum: PAGE_KEYS, default: ["home", "about", "services", "contact"] },
    defaultPages: { type: [String], enum: PAGE_KEYS, default: ["home", "contact"] },
    tags: { type: [LocalizedSchema], default: [] },
    goals: { type: [String], default: [] },
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
