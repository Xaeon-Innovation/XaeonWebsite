import mongoose, { type Document, Schema } from "mongoose";

export interface ICaseStudyStat {
  value: string;
  label: string;
}

export interface ICaseStudy extends Document {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  slug: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  introText?: string;
  showcaseImageUrls: string[];
  dashboardImageUrl?: string;
  narrativeBefore?: string;
  lifestyleImageUrl?: string;
  narrativeAfter?: string;
  stats: ICaseStudyStat[];
  exploreHref?: string;
  exploreLabel?: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CaseStudyStatSchema = new Schema<ICaseStudyStat>(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CaseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    heroTitle: { type: String, trim: true },
    heroSubtitle: { type: String, trim: true },
    heroImageUrl: { type: String, trim: true },
    introText: { type: String, trim: true },
    showcaseImageUrls: { type: [String], default: [] },
    dashboardImageUrl: { type: String, trim: true },
    narrativeBefore: { type: String, trim: true },
    lifestyleImageUrl: { type: String, trim: true },
    narrativeAfter: { type: String, trim: true },
    stats: { type: [CaseStudyStatSchema], default: [] },
    exploreHref: { type: String, trim: true },
    exploreLabel: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CaseStudySchema.index({ published: 1, sortOrder: 1 });
/* sparse: legacy docs without slug must not collide on unique null */
CaseStudySchema.index({ slug: 1 }, { unique: true, sparse: true });

const CaseStudy = mongoose.model<ICaseStudy>("CaseStudy", CaseStudySchema);

export default CaseStudy;
