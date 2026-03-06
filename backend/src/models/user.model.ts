import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string;
  company: string;
  phone_number: string;
  service_requests: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  name: { type: String, required: true },
  company: { type: String },
  phone_number: { type: String, required: true },
  service_requests: [
    { type: Schema.Types.ObjectId, ref: "ServiceRequest", default: [] },
  ],
}, { timestamps: true });

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
