import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  project_type:
    | "Mobile Application"
    | "Website"
    | "Mobile Application + Website"
    | "Desktop Application"
    | "Brand Identity"
    | "Graphic Design"
    | "Digital Marketing Campaign"
    | "Social Media Management";
  project_manager: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  deadline: Date;
}

const ProjectSchema: Schema<IProject> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  project_type: {
    type: String,
    enum: [
      "Mobile Application",
      "Website",
      "Mobile Application + Website",
      "Desktop Application",
      "Brand Identity",
      "Graphic Design",
      "Digital Marketing Campaign",
      "Social Media Management",
    ],
  },
  project_manager: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now },
  deadline: { type: Date, required: true },
});

const Project = mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
