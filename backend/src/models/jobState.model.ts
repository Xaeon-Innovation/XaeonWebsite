import mongoose, { Schema } from "mongoose";

/** Remembers when a scheduled job last ran, so restarts never send a digest twice. */
const JobStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    lastRunDate: { type: String },
  },
  { timestamps: true },
);

const JobState = mongoose.model("JobState", JobStateSchema);
export default JobState;
