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
exports.getBookingSettings = getBookingSettings;
const mongoose_1 = __importStar(require("mongoose"));
const bookingSlots_1 = require("../utils/bookingSlots");
const dayWindowSchema = new mongoose_1.Schema({
    day: { type: Number, required: true, min: 0, max: 6 },
    enabled: { type: Boolean, default: false },
    start: { type: String, default: "10:00" },
    end: { type: String, default: "02:00" },
}, { _id: false });
const bookingSettingsSchema = new mongoose_1.Schema({
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    timezone: { type: String, default: bookingSlots_1.BOOKING_TIMEZONE },
    slotMinutes: { type: Number, default: 30 },
    horizonDays: { type: Number, default: 30 },
    week: { type: [dayWindowSchema], default: () => (0, bookingSlots_1.defaultWeek)() },
    googleRefreshToken: { type: String, default: "" },
    googleAccountEmail: { type: String, default: "" },
}, { timestamps: true });
const BookingSettings = mongoose_1.default.model("BookingSettings", bookingSettingsSchema);
exports.default = BookingSettings;
const SINGLETON = "default";
async function getBookingSettings() {
    let doc = await BookingSettings.findOne({ singletonKey: SINGLETON });
    if (!doc) {
        doc = await BookingSettings.create({
            singletonKey: SINGLETON,
            timezone: bookingSlots_1.BOOKING_TIMEZONE,
            slotMinutes: 30,
            horizonDays: 30,
            week: (0, bookingSlots_1.defaultWeek)(),
        });
    }
    if (!doc.week || doc.week.length !== 7) {
        doc.week = (0, bookingSlots_1.defaultWeek)();
        await doc.save();
    }
    return doc;
}
