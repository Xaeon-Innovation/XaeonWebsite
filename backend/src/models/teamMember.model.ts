import mongoose, { type Document, Schema } from "mongoose";

export interface ITeamMember extends Document {
  name: string;
  role: string;
  photoUrl: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TeamMemberSchema.index({ published: 1, sortOrder: 1 });

const TeamMember = mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);

export default TeamMember;
