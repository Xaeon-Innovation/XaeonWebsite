import mongoose, { type Document, Schema } from "mongoose";

export interface ICaseStudy extends Document {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  exploreHref?: string;
  exploreLabel?: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CaseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true },
    exploreHref: { type: String, trim: true },
    exploreLabel: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CaseStudySchema.index({ published: 1, sortOrder: 1 });

const CaseStudy = mongoose.model<ICaseStudy>("CaseStudy", CaseStudySchema);

export default CaseStudy;
