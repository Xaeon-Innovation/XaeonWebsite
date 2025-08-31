import mongoose, { Document, Schema } from "mongoose";

export interface IServiceRequest extends Document {
  title: string;
  description: string;
  status: "Pending Review" | "Accepted" | "Rejected";
  meeting_date: Date;
  createdAt: Date;
  user: mongoose.Types.ObjectId;
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
  createdAt: { type: Date, required: true, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const ServiceRequest = mongoose.model<IServiceRequest>(
  "ServiceRequest",
  ServiceRequestSchema
);

export default ServiceRequest;
