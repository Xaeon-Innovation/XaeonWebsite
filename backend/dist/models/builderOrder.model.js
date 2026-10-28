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
exports.PAYMENT_STATES = exports.ORDER_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const builderShared_1 = require("./builderShared");
/**
 * submitted        → order saved, no online payment started (no provider for this market, or "from" pricing)
 * awaiting_payment → customer sent to the payment provider's checkout
 * paid             → deposit confirmed by provider webhook (or marked paid by staff)
 * in_build → launched; cancelled at any point.
 */
exports.ORDER_STATUSES = ["submitted", "awaiting_payment", "paid", "in_build", "launched", "cancelled"];
exports.PAYMENT_STATES = ["none", "pending", "paid", "failed"];
const BuilderOrderSchema = new mongoose_1.Schema({
    ref: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: exports.ORDER_STATUSES, default: "submitted", index: true },
    country: { type: String, enum: builderShared_1.COUNTRIES, default: "EG" },
    market: { type: String, enum: builderShared_1.MARKETS, required: true },
    locale: { type: String, enum: ["en", "ar"], default: "en" },
    config: {
        category: { type: String, enum: builderShared_1.BUILDER_CATEGORIES, required: true },
        goal: { type: String, trim: true, maxlength: 40 },
        templateSlug: { type: String, required: true, trim: true },
        planTier: { type: String, enum: builderShared_1.PLAN_TIERS, required: true },
        addonKeys: { type: [String], default: [] },
        billing: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    },
    brand: {
        businessName: { type: String, required: true, trim: true, maxlength: 120 },
        primary: { type: String, trim: true, maxlength: 9 },
        accent: { type: String, trim: true, maxlength: 9 },
        font: { type: String, trim: true, maxlength: 40 },
        tone: { type: String, trim: true, maxlength: 40 },
        logoUrl: { type: String, trim: true },
        assetUrls: { type: [String], default: [] },
        notes: { type: String, trim: true, maxlength: 2000 },
    },
    contact: {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
        phone: { type: String, required: true, trim: true, maxlength: 40 },
        company: { type: String, trim: true, maxlength: 120 },
    },
    quote: { type: mongoose_1.Schema.Types.Mixed, required: true },
    payment: {
        provider: { type: String, trim: true },
        sessionId: { type: String, trim: true },
        status: { type: String, enum: exports.PAYMENT_STATES, default: "none" },
        amount: { type: Number },
        paidAt: { type: Date },
        lastEvent: { type: String, trim: true },
    },
    lead: { type: mongoose_1.Schema.Types.ObjectId, ref: "ServiceRequest" },
    attribution: { type: mongoose_1.Schema.Types.Mixed },
    activity: {
        type: [
            new mongoose_1.Schema({
                type: { type: String, required: true },
                message: { type: String, required: true },
                byName: { type: String },
                at: { type: Date, default: Date.now },
            }, { _id: false }),
        ],
        default: [],
    },
}, { timestamps: true });
BuilderOrderSchema.index({ ref: 1 }, { unique: true });
BuilderOrderSchema.index({ createdAt: -1 });
const BuilderOrder = mongoose_1.default.model("BuilderOrder", BuilderOrderSchema);
exports.default = BuilderOrder;
