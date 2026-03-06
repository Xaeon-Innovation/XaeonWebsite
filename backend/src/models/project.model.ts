import mongoose, { type Document, Schema } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  project_type: mongoose.Types.ObjectId;
  status_count: number;
  project_manager: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  project_type: {
    type: Schema.Types.ObjectId,
    ref: "ProjectType",
    required: true,
  },
  status_count: {
    type: Number,
    default: 0,
  },
  project_manager: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deadline: { type: Date, required: true },
}, { timestamps: true });

const Project = mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
