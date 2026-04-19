"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/** Single-row site configuration (singletonKey = "default"). */
const siteSettingsSchema = new mongoose_1.default.Schema({
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    facebookUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    /** Full `mailto:` URL or plain email — normalized on save */
    emailUrl: { type: String, default: "mailto:info@xaeons.com" },
}, { timestamps: true });
exports.default = mongoose_1.default.model("SiteSettings", siteSettingsSchema);
