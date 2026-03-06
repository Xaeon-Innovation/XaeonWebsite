import mongoose, { type Document, Schema } from "mongoose";

export interface IPackage extends Document {
  title: string;
  project_type: mongoose.Types.ObjectId[];
  discount: number;
}

const PackageSchema: Schema<IPackage> = new Schema({
  title: { type: String, required: true },
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
});

const Package = mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
