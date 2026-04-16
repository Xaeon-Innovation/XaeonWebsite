import mongoose, { type Document, Schema } from "mongoose";

export interface IPackage extends Document {
  title: string;
  description: string;
  project_type: mongoose.Types.ObjectId[];
  discount: number;
  /** When false, package is hidden from the public Packages page (still in admin). */
  showOnWebsite: boolean;
  /** Lower numbers appear first on the site. */
  sortOrder: number;
}

const PackageSchema: Schema<IPackage> = new Schema({
  title: { type: String, required: true },
  description: {
    type: String,
    default: "",
    maxlength: 4000,
  },
  project_type:
    {
      type: [{ type: Schema.Types.ObjectId, ref: "ProjectType" }],
      required: true,
      default: [],
    },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    required: true,
  },
  showOnWebsite: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
});

const Package = mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
