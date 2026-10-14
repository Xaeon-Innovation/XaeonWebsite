import mongoose, { type Document, Schema } from "mongoose";
import { BOOKING_TIMEZONE, defaultWeek, type DayWindow } from "../utils/bookingSlots";

export interface IBookingSettings extends Document {
  singletonKey: string;
  timezone: string;
  slotMinutes: number;
  horizonDays: number;
  week: DayWindow[];
  googleRefreshToken: string;
  googleAccountEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const dayWindowSchema = new Schema<DayWindow>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    enabled: { type: Boolean, default: false },
    start: { type: String, default: "10:00" },
    end: { type: String, default: "02:00" },
  },
  { _id: false },
);

const bookingSettingsSchema = new Schema<IBookingSettings>(
  {
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    timezone: { type: String, default: BOOKING_TIMEZONE },
    slotMinutes: { type: Number, default: 30 },
    horizonDays: { type: Number, default: 30 },
    week: { type: [dayWindowSchema], default: () => defaultWeek() },
    googleRefreshToken: { type: String, default: "" },
    googleAccountEmail: { type: String, default: "" },
  },
  { timestamps: true },
);

const BookingSettings = mongoose.model<IBookingSettings>("BookingSettings", bookingSettingsSchema);

export default BookingSettings;

const SINGLETON = "default";

export async function getBookingSettings(): Promise<IBookingSettings> {
  let doc = await BookingSettings.findOne({ singletonKey: SINGLETON });
  if (!doc) {
    doc = await BookingSettings.create({
      singletonKey: SINGLETON,
      timezone: BOOKING_TIMEZONE,
      slotMinutes: 30,
      horizonDays: 30,
      week: defaultWeek(),
    });
  }
  if (!doc.week || doc.week.length !== 7) {
    doc.week = defaultWeek();
    await doc.save();
  }
  return doc;
}
