import mongoose, { type Document, Schema } from "mongoose";

export interface IServiceRequest extends Document {
  title: string;
  description: string;
  status: "Pending Review" | "Accepted" | "Rejected";
  meeting_date: Date;
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema: Schema<IServiceRequest> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["Pending Review", "Accepted", "Rejected"],
    default: "Pending Review",
  },
  meeting_date: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  package: { type: Schema.Types.ObjectId, ref: "Package" },
}, { timestamps: true });

const ServiceRequest = mongoose.model<IServiceRequest>(
  "ServiceRequest",
  ServiceRequestSchema,
);

export default ServiceRequest;
