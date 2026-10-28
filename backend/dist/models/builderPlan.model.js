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
const BuilderPlanSchema = new mongoose_1.Schema({
    tier: { type: String, enum: builderShared_1.PLAN_TIERS, required: true },
    name: { type: builderShared_1.LocalizedSchema, required: true },
    summary: { type: builderShared_1.LocalizedSchema, default: () => ({}) },
    prices: { type: builderShared_1.PricesSchema, default: () => ({}) },
    includedPages: { type: Number, min: 1, default: 5 },
    extraPagePrice: {
        EGP: { type: Number, min: 0, default: 1000 },
        AED: { type: Number, min: 0, default: 140 },
        USD: { type: Number, min: 0, default: 40 },
    },
    quoted: { type: Boolean, default: false },
    features: { type: [builderShared_1.LocalizedSchema], default: [] },
    highlighted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
}, { timestamps: true });
BuilderPlanSchema.index({ published: 1, sortOrder: 1 });
BuilderPlanSchema.index({ tier: 1 }, { unique: true });
const BuilderPlan = mongoose_1.default.model("BuilderPlan", BuilderPlanSchema);
exports.default = BuilderPlan;
