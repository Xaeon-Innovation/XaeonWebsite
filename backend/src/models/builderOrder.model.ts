import mongoose, { type Document, Schema } from "mongoose";
import type { Attribution } from "../utils/attribution";
import type { Quote } from "../utils/builderQuote";
import { BUILDER_CATEGORIES, COUNTRIES, CORNER_STYLES, MARKETS, PAGE_KEYS, PLAN_TIERS, THEME_MODES, type BuilderCategory, type Country, type Market, type PlanTier } from "./builderShared";

/**
 * submitted        → order saved, no online payment started (no provider for this market, or "from" pricing)
 * awaiting_payment → customer sent to the payment provider's checkout
 * paid             → deposit confirmed by provider webhook (or marked paid by staff)
 * in_build → launched; cancelled at any point.
 */
export const ORDER_STATUSES = ["submitted", "awaiting_payment", "paid", "in_build", "launched", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATES = ["none", "pending", "paid", "failed"] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export interface IOrderActivity {
  type: string;
  message: string;
  byName?: string;
  at: Date;
}

export interface IBuilderOrder extends Document {
  ref: string;
  status: OrderStatus;
  /** Business country (ISO code, or OTHER); decides `market`. */
  country: Country;
  market: Market;
  locale: "en" | "ar";
  config: {
    category: BuilderCategory;
    goal?: string;
    templateSlug: string;
    /** Pages the customer chose (page library keys). */
    pages: string[];
    planTier: PlanTier;
    addonKeys: string[];
    billing: "monthly" | "annual";
  };
  brand: {
    businessName: string;
    primary: string;
    accent: string;
    font: string;
    mode?: string;
    corners?: string;
    tone?: string;
    logoUrl?: string;
    assetUrls: string[];
    notes?: string;
  };
  contact: { name: string; email: string; phone: string; company?: string };
  quote: Quote;
  payment: {
    provider?: string;
    sessionId?: string;
    status: PaymentState;
    /** Amount charged, in `currency` (may differ from the quote currency when converted). */
    amount?: number;
    currency?: string;
    /** 1 quote-currency unit = rate × `currency`, when converted. */
    rate?: number;
    paidAt?: Date;
    lastEvent?: string;
  };
  lead?: mongoose.Types.ObjectId;
  attribution?: Attribution;
  activity: IOrderActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const BuilderOrderSchema = new Schema<IBuilderOrder>(
  {
    ref: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ORDER_STATUSES, default: "submitted", index: true },
    country: { type: String, enum: COUNTRIES, default: "EG" },
    market: { type: String, enum: MARKETS, required: true },
    locale: { type: String, enum: ["en", "ar"], default: "en" },
    config: {
      category: { type: String, enum: BUILDER_CATEGORIES, required: true },
      goal: { type: String, trim: true, maxlength: 40 },
      templateSlug: { type: String, required: true, trim: true },
      pages: { type: [String], enum: PAGE_KEYS, default: [] },
      planTier: { type: String, enum: PLAN_TIERS, required: true },
      addonKeys: { type: [String], default: [] },
      billing: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    },
    brand: {
      businessName: { type: String, required: true, trim: true, maxlength: 120 },
      primary: { type: String, trim: true, maxlength: 9 },
      accent: { type: String, trim: true, maxlength: 9 },
      font: { type: String, trim: true, maxlength: 40 },
      mode: { type: String, enum: THEME_MODES },
      corners: { type: String, enum: CORNER_STYLES },
      tone: { type: String, trim: true, maxlength: 40 },
      logoUrl: { type: String, trim: true },
      assetUrls: { type: [String], default: [] },
      notes: { type: String, trim: true, maxlength: 2000 },
    },
    contact: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
      phone: { type: String, required: true, trim: true, maxlength: 40 },
      company: { type: String, trim: true, maxlength: 120 },
    },
    quote: { type: Schema.Types.Mixed, required: true },
    payment: {
      provider: { type: String, trim: true },
      sessionId: { type: String, trim: true },
      status: { type: String, enum: PAYMENT_STATES, default: "none" },
      amount: { type: Number },
      currency: { type: String, trim: true },
      rate: { type: Number },
      paidAt: { type: Date },
      lastEvent: { type: String, trim: true },
    },
    lead: { type: Schema.Types.ObjectId, ref: "ServiceRequest" },
    attribution: { type: Schema.Types.Mixed },
    activity: {
      type: [
        new Schema<IOrderActivity>(
          {
            type: { type: String, required: true },
            message: { type: String, required: true },
            byName: { type: String },
            at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

BuilderOrderSchema.index({ ref: 1 }, { unique: true });
BuilderOrderSchema.index({ createdAt: -1 });

const BuilderOrder = mongoose.model<IBuilderOrder>("BuilderOrder", BuilderOrderSchema);

export default BuilderOrder;
