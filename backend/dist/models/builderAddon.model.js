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
exports.ADDON_KINDS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const builderShared_1 = require("./builderShared");
/**
 * `module`: a feature of the website itself (booking, payments, blog…).
 * `service`: another Xaeon offer sold alongside the site (mobile app, Polara, Velora…), usually with a bundle discount.
 */
exports.ADDON_KINDS = ["module", "service"];
const BuilderAddonSchema = new mongoose_1.Schema({
    key: { type: String, required: true, trim: true, lowercase: true },
    kind: { type: String, enum: exports.ADDON_KINDS, default: "module" },
    name: { type: builderShared_1.LocalizedSchema, required: true },
    description: { type: builderShared_1.LocalizedSchema, default: () => ({}) },
    icon: { type: String, trim: true },
    prices: { type: builderShared_1.PricesSchema, default: () => ({}) },
    quoted: { type: Boolean, default: false },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    badge: { type: builderShared_1.LocalizedSchema },
    includedIn: { type: [String], enum: builderShared_1.PLAN_TIERS, default: [] },
    minPlan: { type: String, enum: builderShared_1.PLAN_TIERS },
    categories: { type: [String], enum: builderShared_1.BUILDER_CATEGORIES, default: [] },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
}, { timestamps: true });
BuilderAddonSchema.index({ published: 1, sortOrder: 1 });
BuilderAddonSchema.index({ key: 1 }, { unique: true });
const BuilderAddon = mongoose_1.default.model("BuilderAddon", BuilderAddonSchema);
exports.default = BuilderAddon;
