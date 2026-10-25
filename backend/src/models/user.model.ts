import mongoose, { type Document, Schema } from "mongoose";

export type UserRole = "admin" | "user";

export interface IUser extends Document {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string;
  company: string;
  phone_number: string;
  service_requests: mongoose.Types.ObjectId[];
  role: UserRole;
  /** sha256 of a one-time "set your password" token (invites); never the token itself. */
  inviteTokenHash?: string;
  inviteExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  name: { type: String, required: true },
  company: { type: String },
  phone_number: { type: String, required: true },
  service_requests: {
    type: [{ type: Schema.Types.ObjectId, ref: "ServiceRequest" }],
    default: [],
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    required: true,
  },
  inviteTokenHash: { type: String, select: false, index: true, sparse: true },
  inviteExpiresAt: { type: Date, select: false },
}, { timestamps: true });

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
