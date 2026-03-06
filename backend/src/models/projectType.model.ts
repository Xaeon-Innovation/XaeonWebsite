import mongoose, { type Document, Schema } from "mongoose";

export interface IProjectType extends Document {
  title: string;
  stages: string[];
}

const ProjectTypeSchema: Schema<IProjectType> = new Schema({
  title: { type: String, required: true },
  stages: [{ type: String }],
});

const ProjectType = mongoose.model<IProjectType>(
  "ProjectType",
  ProjectTypeSchema,
);

export default ProjectType;
