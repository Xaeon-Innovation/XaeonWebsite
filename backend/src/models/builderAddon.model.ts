import mongoose, { type Document, Schema } from "mongoose";
import {
  BUILDER_CATEGORIES,
  LocalizedSchema,
  PLAN_TIERS,
  PricesSchema,
  type BuilderCategory,
  type Localized,
  type PlanTier,
  type Prices,
} from "./builderShared";

/**
 * `module`: a feature of the website itself (booking, payments, blog…).
 * `service`: another Xaeon offer sold alongside the site (mobile app, Polara, Velora…), usually with a bundle discount.
 */
export const ADDON_KINDS = ["module", "service"] as const;
export type AddonKind = (typeof ADDON_KINDS)[number];

export interface IBuilderAddon extends Document {
  key: string;
  kind: AddonKind;
  name: Localized;
  description: Localized;
  /** lucide-react icon name used by the website, e.g. "calendar". */
  icon?: string;
  prices: Prices;
  /** Price is a starting point ("from"); the team confirms scope, so it is left out of the deposit. */
  quoted: boolean;
  /** Bundle discount on the one-time price when bought with a website, e.g. 15 for the mobile app. */
  discountPercent: number;
  badge?: Localized;
  /** Plans where this add-on is included at no extra charge. */
  includedIn: PlanTier[];
  minPlan?: PlanTier;
  /** Categories that should suggest it first (empty = everywhere). */
  categories: BuilderCategory[];
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BuilderAddonSchema = new Schema<IBuilderAddon>(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    kind: { type: String, enum: ADDON_KINDS, default: "module" },
    name: { type: LocalizedSchema, required: true },
    description: { type: LocalizedSchema, default: () => ({}) },
    icon: { type: String, trim: true },
    prices: { type: PricesSchema, default: () => ({}) },
    quoted: { type: Boolean, default: false },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    badge: { type: LocalizedSchema },
    includedIn: { type: [String], enum: PLAN_TIERS, default: [] },
    minPlan: { type: String, enum: PLAN_TIERS },
    categories: { type: [String], enum: BUILDER_CATEGORIES, default: [] },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BuilderAddonSchema.index({ published: 1, sortOrder: 1 });
BuilderAddonSchema.index({ key: 1 }, { unique: true });

const BuilderAddon = mongoose.model<IBuilderAddon>("BuilderAddon", BuilderAddonSchema);

export default BuilderAddon;
