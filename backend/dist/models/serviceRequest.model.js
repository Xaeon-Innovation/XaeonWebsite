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
exports.LEAD_CURRENCIES = exports.OPEN_STAGES = exports.LEAD_STAGES = exports.ENQUIRY_SOURCES = void 0;
exports.isEnquirySource = isEnquirySource;
exports.isLeadStage = isLeadStage;
const mongoose_1 = __importStar(require("mongoose"));
/** Public, no-login enquiry sources (website forms). */
exports.ENQUIRY_SOURCES = ["contact", "service", "package", "product"];
function isEnquirySource(source) {
    return exports.ENQUIRY_SOURCES.includes(source);
}
/** Sales pipeline, in order. `won` and `lost` are closed stages. */
exports.LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"];
exports.OPEN_STAGES = ["new", "contacted", "qualified", "proposal"];
function isLeadStage(value) {
    return exports.LEAD_STAGES.includes(value);
}
exports.LEAD_CURRENCIES = ["EGP", "USD", "AED", "SAR", "EUR"];
function isRegisteredSource() {
    return !isEnquirySource(this.source) && this.source !== "booking";
}
function requiresMeetingDate() {
    return isRegisteredSource.call(this) || this.source === "booking";
}
const ServiceRequestSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ["Pending Review", "Accepted", "Rejected"],
        default: "Pending Review",
    },
    source: {
        type: String,
        enum: ["registered", "booking", ...exports.ENQUIRY_SOURCES],
        default: "registered",
    },
    meeting_date: {
        type: Date,
        required() {
            return requiresMeetingDate.call(this);
        },
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required() {
            return isRegisteredSource.call(this);
        },
    },
    package: { type: mongoose_1.Schema.Types.ObjectId, ref: "Package" },
    contactName: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    company: { type: String },
    interest: { type: String },
    meetLink: { type: String },
    googleEventId: { type: String },
    locale: { type: String, enum: ["en", "ar"] },
    stage: { type: String, enum: exports.LEAD_STAGES, default: "new", index: true },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "Employee" },
    followUpAt: { type: Date, default: null },
    value: { type: Number, min: 0, default: null },
    currency: { type: String, enum: exports.LEAD_CURRENCIES, default: "EGP" },
    lostReason: { type: String, trim: true, maxlength: 300 },
    firstResponseAt: { type: Date },
    contactKey: { type: String, index: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project" },
    notes: {
        type: [
            new mongoose_1.Schema({
                text: { type: String, required: true, trim: true, maxlength: 5000 },
                byName: { type: String, required: true },
                by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
                at: { type: Date, default: Date.now },
            }),
        ],
        default: [],
    },
    activity: {
        type: [
            new mongoose_1.Schema({
                type: { type: String, required: true },
                message: { type: String, required: true, maxlength: 2000 },
                byName: String,
                by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
                at: { type: Date, default: Date.now },
            }),
        ],
        default: [],
    },
    attribution: {
        type: new mongoose_1.Schema({
            utmSource: String,
            utmMedium: String,
            utmCampaign: String,
            utmTerm: String,
            utmContent: String,
            gclid: String,
            fbclid: String,
            referrer: String,
            landingPage: String,
            firstSeenAt: Date,
        }, { _id: false }),
        default: undefined,
    },
}, { timestamps: true });
ServiceRequestSchema.index({ "attribution.utmSource": 1, createdAt: -1 });
ServiceRequestSchema.index({ stage: 1, createdAt: -1 });
ServiceRequestSchema.index({ followUpAt: 1, stage: 1 });
// Every new lead gets a lookup key and a "created" entry in its history.
ServiceRequestSchema.pre("save", function setLeadDefaults(next) {
    if (this.contactEmail)
        this.contactKey = this.contactEmail.trim().toLowerCase();
    if (this.isNew && this.activity.length === 0) {
        this.activity.push({ type: "created", message: `Lead created from ${this.source}`, at: new Date() });
    }
    next();
});
ServiceRequestSchema.index({ meeting_date: 1 }, {
    unique: true,
    partialFilterExpression: {
        source: "booking",
        status: { $in: ["Pending Review", "Accepted"] },
    },
});
const ServiceRequest = mongoose_1.default.model("ServiceRequest", ServiceRequestSchema);
exports.default = ServiceRequest;
