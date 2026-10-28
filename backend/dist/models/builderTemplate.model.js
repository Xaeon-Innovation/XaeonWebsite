"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const builderShared_1 = require("./builderShared");
const BuilderTemplateSchema = new mongoose_1.Schema({
    slug: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, enum: builderShared_1.BUILDER_CATEGORIES, required: true },
    name: { type: builderShared_1.LocalizedSchema, required: true },
    tagline: { type: builderShared_1.LocalizedSchema, default: () => ({}) },
    previewImageUrl: { type: String, trim: true },
    layout: { type: String, enum: builderShared_1.TEMPLATE_LAYOUTS, default: "classic" },
    hero: { type: String, enum: builderShared_1.HERO_STYLES, default: "split" },
    mode: { type: String, enum: builderShared_1.THEME_MODES, default: "light" },
    corners: { type: String, enum: builderShared_1.CORNER_STYLES, default: "soft" },
    defaultBrand: {
        primary: { type: String, trim: true, default: "#72c04f" },
        accent: { type: String, trim: true, default: "#1b3d50" },
        font: { type: String, trim: true, default: "modern" },
    },
    pageKeys: { type: [String], enum: builderShared_1.PAGE_KEYS, default: ["home", "about", "services", "contact"] },
    defaultPages: { type: [String], enum: builderShared_1.PAGE_KEYS, default: ["home", "contact"] },
    tags: { type: [builderShared_1.LocalizedSchema], default: [] },
    goals: { type: [String], default: [] },
    features: { type: [builderShared_1.LocalizedSchema], default: [] },
    recommendedAddons: { type: [String], default: [] },
    minPlan: { type: String, enum: builderShared_1.PLAN_TIERS, default: "launch" },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
}, { timestamps: true });
BuilderTemplateSchema.index({ published: 1, sortOrder: 1 });
BuilderTemplateSchema.index({ slug: 1 }, { unique: true });
const BuilderTemplate = mongoose_1.default.model("BuilderTemplate", BuilderTemplateSchema);
exports.default = BuilderTemplate;
