import mongoose, { type Document, Schema } from "mongoose";
import type { Attribution } from "../utils/attribution";

/** Public, no-login enquiry sources (website forms). */
export const ENQUIRY_SOURCES = ["contact", "service", "package", "product"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

/** `builder`: a Website Builder order (see builderOrder.model.ts). */
export type ServiceRequestSource = "registered" | "booking" | "builder" | EnquirySource;

export function isEnquirySource(source: unknown): source is EnquirySource {
  return (ENQUIRY_SOURCES as readonly unknown[]).includes(source);
}

/** Sales pipeline, in order. `won` and `lost` are closed stages. */
export const LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export const OPEN_STAGES: readonly LeadStage[] = ["new", "contacted", "qualified", "proposal"];

export function isLeadStage(value: unknown): value is LeadStage {
  return (LEAD_STAGES as readonly unknown[]).includes(value);
}

export const LEAD_CURRENCIES = ["EGP", "USD", "AED", "SAR", "EUR"] as const;
export type LeadCurrency = (typeof LEAD_CURRENCIES)[number];

export type LeadActivityType =
  | "created"
  | "stage"
  | "owner"
  | "followup"
  | "value"
  | "status"
  | "note"
  | "email"
  | "converted";

export interface ILeadNote {
  _id: mongoose.Types.ObjectId;
  text: string;
  byName: string;
  by?: mongoose.Types.ObjectId;
  at: Date;
}

export interface ILeadActivity {
  _id: mongoose.Types.ObjectId;
  type: LeadActivityType;
  message: string;
  byName?: string;
  by?: mongoose.Types.ObjectId;
  at: Date;
}

export interface IServiceRequest extends Document {
  title: string;
  description: string;
  status: "Pending Review" | "Accepted" | "Rejected";
  source: ServiceRequestSource;
  /** Set when source is registered (logged-in user flow). */
  meeting_date?: Date;
  user?: mongoose.Types.ObjectId;
  package?: mongoose.Types.ObjectId;
  /** Contact / service-interest enquiries (no account). */
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  company?: string;
  /** Service page: chosen offering; distinguishes from generic contact. */
  interest?: string;
  /** Google Meet URL for source "booking". */
  meetLink?: string;
  /** Google Calendar event id for source "booking". */
  googleEventId?: string;
  /** First-touch marketing source (UTM / click ids / referrer) captured by the website. */
  attribution?: Attribution;
  /** Website language the lead used ("en" | "ar"), for replies and auto-responses. */
  locale?: "en" | "ar";

  /* ---- CRM ---- */
  stage: LeadStage;
  owner?: mongoose.Types.ObjectId;
  followUpAt?: Date | null;
  value?: number | null;
  currency: LeadCurrency;
  lostReason?: string;
  /** First time someone on the team replied or moved the lead past "new". */
  firstResponseAt?: Date;
  /** Lower-cased email, used to find earlier leads from the same person. */
  contactKey?: string;
  project?: mongoose.Types.ObjectId;
  notes: ILeadNote[];
  activity: ILeadActivity[];
  createdAt: Date;
  updatedAt: Date;
}

function isRegisteredSource(this: IServiceRequest): boolean {
  return !isEnquirySource(this.source) && this.source !== "booking" && this.source !== "builder";
}

function requiresMeetingDate(this: IServiceRequest): boolean {
  return isRegisteredSource.call(this) || this.source === "booking";
}

const ServiceRequestSchema: Schema<IServiceRequest> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["Pending Review", "Accepted", "Rejected"],
    default: "Pending Review",
  },
  source: {
    type: String,
    enum: ["registered", "booking", "builder", ...ENQUIRY_SOURCES],
    default: "registered",
  },
  meeting_date: {
    type: Date,
    required(this: IServiceRequest) {
      return requiresMeetingDate.call(this);
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required(this: IServiceRequest) {
      return isRegisteredSource.call(this);
    },
  },
  package: { type: Schema.Types.ObjectId, ref: "Package" },
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  company: { type: String },
  interest: { type: String },
  meetLink: { type: String },
  googleEventId: { type: String },
  locale: { type: String, enum: ["en", "ar"] },
  stage: { type: String, enum: LEAD_STAGES, default: "new", index: true },
  owner: { type: Schema.Types.ObjectId, ref: "Employee" },
  followUpAt: { type: Date, default: null },
  value: { type: Number, min: 0, default: null },
  currency: { type: String, enum: LEAD_CURRENCIES, default: "EGP" },
  lostReason: { type: String, trim: true, maxlength: 300 },
  firstResponseAt: { type: Date },
  contactKey: { type: String, index: true },
  project: { type: Schema.Types.ObjectId, ref: "Project" },
  notes: {
    type: [
      new Schema(
        {
          text: { type: String, required: true, trim: true, maxlength: 5000 },
          byName: { type: String, required: true },
          by: { type: Schema.Types.ObjectId, ref: "User" },
          at: { type: Date, default: Date.now },
        },
      ),
    ],
    default: [],
  },
  activity: {
    type: [
      new Schema(
        {
          type: { type: String, required: true },
          message: { type: String, required: true, maxlength: 2000 },
          byName: String,
          by: { type: Schema.Types.ObjectId, ref: "User" },
          at: { type: Date, default: Date.now },
        },
      ),
    ],
    default: [],
  },
  attribution: {
    type: new Schema(
      {
        utmSource: String,
        utmMedium: String,
        utmCampaign: String,
        utmTerm: String,
        utmContent: String,
        gclid: String,
        fbclid: String,
        referrer: String,
        landingPage: String,
        firstSeenAt: Date,
      },
      { _id: false },
    ),
    default: undefined,
  },
}, { timestamps: true });

ServiceRequestSchema.index({ "attribution.utmSource": 1, createdAt: -1 });
ServiceRequestSchema.index({ stage: 1, createdAt: -1 });
ServiceRequestSchema.index({ followUpAt: 1, stage: 1 });

// Every new lead gets a lookup key and a "created" entry in its history.
ServiceRequestSchema.pre("save", function setLeadDefaults(next) {
  if (this.contactEmail) this.contactKey = this.contactEmail.trim().toLowerCase();
  if (this.isNew && this.activity.length === 0) {
    this.activity.push({ type: "created", message: `Lead created from ${this.source}`, at: new Date() } as ILeadActivity);
  }
  next();
});

ServiceRequestSchema.index(
  { meeting_date: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: "booking",
      status: { $in: ["Pending Review", "Accepted"] },
    },
  },
);

const ServiceRequest = mongoose.model<IServiceRequest>(
  "ServiceRequest",
  ServiceRequestSchema,
);

export default ServiceRequest;
