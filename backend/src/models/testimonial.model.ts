import mongoose, { type Document, Schema } from "mongoose";

export interface ITestimonial extends Document {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  /** Optional client logo, also shown in the homepage logo strip. */
  logoUrl?: string;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    quote: { type: String, required: true, trim: true, maxlength: 1000 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, trim: true, maxlength: 120 },
    company: { type: String, trim: true, maxlength: 120 },
    logoUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TestimonialSchema.index({ published: 1, sortOrder: 1 });

const Testimonial = mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export default Testimonial;
