import mongoose from "mongoose";

/** Single-row site configuration (singletonKey = "default"). */
const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    facebookUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    /** Full `mailto:` URL or plain email — normalized on save */
    emailUrl: { type: String, default: "mailto:info@xaeons.com" },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);
