import mongoose, { type Document, Schema } from "mongoose";
import type { Attribution } from "../utils/attribution";

/** Public, no-login enquiry sources (website forms). */
export const ENQUIRY_SOURCES = ["contact", "service", "package", "product"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

export type ServiceRequestSource = "registered" | "booking" | EnquirySource;

export function isEnquirySource(source: unknown): source is EnquirySource {
  return (ENQUIRY_SOURCES as readonly unknown[]).includes(source);
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
  createdAt: Date;
  updatedAt: Date;
}

function isRegisteredSource(this: IServiceRequest): boolean {
  return !isEnquirySource(this.source) && this.source !== "booking";
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
    enum: ["registered", "booking", ...ENQUIRY_SOURCES],
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
