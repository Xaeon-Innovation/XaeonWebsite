import mongoose, { type Document, Schema } from "mongoose";
import { LocalizedSchema, PLAN_TIERS, PricesSchema, type Localized, type PlanTier, type Prices } from "./builderShared";

export interface IBuilderPlan extends Document {
  tier: PlanTier;
  name: Localized;
  summary: Localized;
  prices: Prices;
  /** "From" pricing (Custom): no online deposit, the team sends a scoped quote. */
  quoted: boolean;
  features: Localized[];
  highlighted: boolean;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BuilderPlanSchema = new Schema<IBuilderPlan>(
  {
    tier: { type: String, enum: PLAN_TIERS, required: true },
    name: { type: LocalizedSchema, required: true },
    summary: { type: LocalizedSchema, default: () => ({}) },
    prices: { type: PricesSchema, default: () => ({}) },
    quoted: { type: Boolean, default: false },
    features: { type: [LocalizedSchema], default: [] },
    highlighted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BuilderPlanSchema.index({ published: 1, sortOrder: 1 });
BuilderPlanSchema.index({ tier: 1 }, { unique: true });

const BuilderPlan = mongoose.model<IBuilderPlan>("BuilderPlan", BuilderPlanSchema);

export default BuilderPlan;
