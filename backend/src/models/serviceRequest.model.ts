import mongoose, { type Document, Schema } from "mongoose";

export type ServiceRequestSource =
  | "registered"
  | "contact"
  | "service"
  | "package";

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
  createdAt: Date;
  updatedAt: Date;
}

function isRegisteredSource(this: IServiceRequest): boolean {
  return (
    this.source !== "contact" &&
    this.source !== "service" &&
    this.source !== "package"
  );
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
    enum: ["registered", "contact", "service", "package"],
    default: "registered",
  },
  meeting_date: {
    type: Date,
    required(this: IServiceRequest) {
      return isRegisteredSource.call(this);
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
}, { timestamps: true });

const ServiceRequest = mongoose.model<IServiceRequest>(
  "ServiceRequest",
  ServiceRequestSchema,
);

export default ServiceRequest;
