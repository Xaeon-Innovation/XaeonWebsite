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
exports.STAR_PRODUCTS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * A client shown in the website's "galaxy of stars" (see docs/website-builder/galaxy.md).
 * Stars are grouped into constellations, by default the product the client uses.
 */
exports.STAR_PRODUCTS = ["website", "app", "polara", "velora", "custom"];
const StarSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    logoUrl: { type: String, trim: true },
    industry: { type: String, trim: true, maxlength: 80 },
    product: { type: String, enum: exports.STAR_PRODUCTS, default: "website" },
    constellation: { type: String, trim: true, maxlength: 40 },
    country: { type: String, trim: true, maxlength: 60 },
    since: { type: Number, min: 2000, max: 2100 },
    magnitude: { type: Number, min: 1, max: 3, default: 1 },
    highlight: { type: String, trim: true, maxlength: 200 },
    caseStudy: { type: mongoose_1.Schema.Types.ObjectId, ref: "CaseStudy" },
    url: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
}, { timestamps: true });
StarSchema.index({ published: 1, sortOrder: 1 });
const Star = mongoose_1.default.model("Star", StarSchema);
exports.default = Star;
