import mongoose, { Document, Schema } from "mongoose";

export interface IEmployee extends Document {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string;
  department: string;
  phone_number: string;
  role:
    | "Backend Developer"
    | "Frontend Developer"
    | "Full-Stack Developer"
    | "Graphic Designer"
    | "Project Manager"
    | "Sales"
    | "Admin";
  projects: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const EmployeeSchema: Schema<IEmployee> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String },
  phone_number: { type: String, required: true },
  role: {
    type: String,
    enum: [
      "Backend Developer",
      "Frontend Developer",
      "Full-Stack Developer",
      "Graphic Designer",
      "Project Manager",
      "Sales",
      "Admin",
    ],
  },
  projects: [{ type: Schema.Types.ObjectId, ref: "Project", default: [] }],
  createdAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;
