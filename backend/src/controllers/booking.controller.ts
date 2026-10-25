import type { Request, Response } from "express";
import jwt, { type Secret } from "jsonwebtoken";
import mongoose from "mongoose";

import Package from "../models/package.model";
import ServiceRequest from "../models/serviceRequest.model";
import { getBookingSettings } from "../models/bookingSettings.model";
import { notifyEmails, resendConfigured, sendBookingEmails } from "../services/bookingEmail";
import {
  GoogleAuthError,
  buildGoogleAuthUrl,
  createMeetEvent,
  deleteMeetEvent,
  exchangeGoogleCode,
  googleOAuthConfigured,
  listBusy,
  primaryCalendarEmail,
} from "../services/googleCalendar";
import {
  BOOKING_TIMEZONE,
  formatSlotLabel,
  generateSlots,
  isValidTime,
  monthBounds,
  todayInZone,
  type DayWindow,
} from "../utils/bookingSlots";
import { serverErrorMessage } from "../utils/serverError";
import { parseAttribution } from "../utils/attribution";

const SLOT_LENGTHS = [15, 20, 30, 45, 60];

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function frontendOrigin(preferred?: string): string {
  const allowed = allowedOrigins();
  const localDev = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
  if (preferred) {
    try {
      const origin = new URL(preferred).origin;
      const devOk = process.env.NODE_ENV !== "production" && localDev.has(origin);
      if (devOk || allowed.length === 0 || allowed.includes(origin)) return origin;
    } catch {
      /* ignore invalid origin */
    }
  }
  const explicit = process.env.FRONTEND_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (allowed[0]) return allowed[0];
  return "http://localhost:5173";
}

function publicWeek(week: DayWindow[]) {
  return [...week]
    .sort((a, b) => a.day - b.day)
    .map((day) => ({
      day: day.day,
      enabled: day.enabled,
      start: day.start,
      end: day.end,
    }));
}

function slotsForSettings(
  settings: {
    timezone: string;
    slotMinutes: number;
    horizonDays: number;
    week: DayWindow[];
  },
  fromDate: string,
  toDate: string,
  now = new Date(),
) {
  return generateSlots({
    timezone: settings.timezone || BOOKING_TIMEZONE,
    slotMinutes: settings.slotMinutes,
    horizonDays: settings.horizonDays,
    week: settings.week,
    fromDate,
    toDate,
    now,
  });
}

function overlapsBusy(start: Date, end: Date, busy: { start: Date; end: Date }[]): boolean {
  const a = start.getTime();
  const b = end.getTime();
  return busy.some((block) => a < block.end.getTime() && b > block.start.getTime());
}

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getBookingSettings();
    const timezone = settings.timezone || BOOKING_TIMEZONE;
    const monthParam = typeof req.query.month === "string" ? req.query.month : "";
    const month = /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : todayInZone(timezone).slice(0, 7);
    const bounds = monthBounds(month);
    if (!bounds) {
      res.status(400).json({ error: "month must be YYYY-MM" });
      return;
    }

    const base = {
      timezone,
      slotMinutes: settings.slotMinutes,
      horizonDays: settings.horizonDays,
      month,
    };

    if (!settings.googleRefreshToken || !googleOAuthConfigured() || !resendConfigured()) {
      res.status(200).json({ ...base, open: false, reason: "not_connected", dates: {} });
      return;
    }

    const slots = slotsForSettings(settings, bounds.fromDate, bounds.toDate);
    let busy: { start: Date; end: Date }[] = [];
    if (slots.length > 0) {
      const timeMin = slots[0].start;
      const timeMax = slots[slots.length - 1].end;
      try {
        busy = await listBusy(settings.googleRefreshToken, timeMin, timeMax, timezone);
      } catch (err) {
        if (err instanceof GoogleAuthError) {
          res.status(200).json({ ...base, open: false, reason: "not_connected", dates: {} });
          return;
        }
        console.error(err);
        res.status(200).json({ ...base, open: false, reason: "unavailable", dates: {} });
        return;
      }
    }

    const taken = slots.length
      ? await ServiceRequest.find({
          source: "booking",
          status: { $in: ["Pending Review", "Accepted"] },
          meeting_date: { $in: slots.map((slot) => slot.start) },
        }).select("meeting_date")
      : [];
    const takenMs = new Set(
      taken
        .map((row) => row.meeting_date?.getTime())
        .filter((ms): ms is number => typeof ms === "number"),
    );

    const dates: Record<string, { start: string; label: string }[]> = {};
    for (const slot of slots) {
      if (takenMs.has(slot.start.getTime())) continue;
      if (overlapsBusy(slot.start, slot.end, busy)) continue;
      const list = dates[slot.date] ?? [];
      list.push({ start: slot.start.toISOString(), label: slot.label });
      dates[slot.date] = list;
    }

    res.status(200).json({ ...base, open: true, reason: null, dates });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to load availability"),
    });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  let createdEventId = "";
  let refreshToken = "";
  try {
    const settings = await getBookingSettings();
    if (!settings.googleRefreshToken || !googleOAuthConfigured() || !resendConfigured()) {
      res.status(503).json({ error: "Online booking is not open yet." });
      return;
    }
    refreshToken = settings.googleRefreshToken;

    const body = req.body as Record<string, unknown> | undefined;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const company =
      typeof body?.company === "string" && body.company.trim() !== ""
        ? body.company.trim()
        : undefined;
    const slotRaw = typeof body?.slot === "string" ? body.slot.trim() : "";
    const attribution = parseAttribution(body?.attribution);
    const locale = body?.locale === "ar" ? "ar" : "en";

    if (name.length < 2 || phone.length < 7 || message.length < 10 || message.length > 4000) {
      res.status(400).json({ error: "Name, phone, and a short message are required." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (company && company.length > 120) {
      res.status(400).json({ error: "Company name is too long." });
      return;
    }

    const slotStart = new Date(slotRaw);
    if (!slotRaw || Number.isNaN(slotStart.getTime())) {
      res.status(400).json({ error: "Choose an available time." });
      return;
    }

    const timezone = settings.timezone || BOOKING_TIMEZONE;
    const slotDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(slotStart);

    const matches = slotsForSettings(settings, slotDate, slotDate).filter(
      (slot) => slot.start.getTime() === slotStart.getTime(),
    );
    const slot = matches[0];
    if (!slot) {
      res.status(409).json({ error: "That time is no longer available." });
      return;
    }

    const clash = await ServiceRequest.findOne({
      source: "booking",
      status: { $in: ["Pending Review", "Accepted"] },
      meeting_date: slot.start,
    }).select("_id");
    if (clash) {
      res.status(409).json({ error: "That time is no longer available." });
      return;
    }

    const busy = await listBusy(refreshToken, slot.start, slot.end, timezone);
    if (overlapsBusy(slot.start, slot.end, busy)) {
      res.status(409).json({ error: "That time is no longer available." });
      return;
    }

    let packageId: mongoose.Types.ObjectId | undefined;
    let packageTitle: string | undefined;
    const packageIdRaw = typeof body?.packageId === "string" ? body.packageId.trim() : "";
    if (packageIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(packageIdRaw)) {
        res.status(400).json({ error: "Package not found" });
        return;
      }
      const pkg = await Package.findById(packageIdRaw);
      if (!pkg) {
        res.status(400).json({ error: "Package not found" });
        return;
      }
      packageId = new mongoose.Types.ObjectId(packageIdRaw);
      packageTitle = pkg.title?.trim() || "Package";
    }

    const attendees = [...new Set([email, ...notifyEmails()])];
    const description = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      company ? `Company: ${company}` : "",
      packageTitle ? `Package: ${packageTitle}` : "",
      "",
      message,
    ]
      .filter((line) => line !== "")
      .join("\n");

    const event = await createMeetEvent({
      refreshToken,
      summary: `Xaeon consultation — ${name}`,
      description,
      start: slot.start,
      end: slot.end,
      timeZone: timezone,
      attendees,
    });
    createdEventId = event.eventId;

    const whenLabel = formatSlotLabel(slot.start, timezone);
    const serviceRequest = await ServiceRequest.create({
      source: "booking",
      title: packageTitle ? `Meeting: ${packageTitle}` : `Google Meet: ${name}`,
      description: message,
      status: "Pending Review",
      meeting_date: slot.start,
      contactName: name,
      contactEmail: email,
      contactPhone: phone,
      company,
      interest: packageTitle,
      package: packageId,
      meetLink: event.meetLink,
      googleEventId: event.eventId,
      attribution,
      locale,
    });

    let emailWarning: string | undefined;
    try {
      await sendBookingEmails({
        name,
        email,
        phone,
        company,
        message,
        whenLabel,
        meetLink: event.meetLink,
        packageTitle,
        attribution,
      });
    } catch (err) {
      console.error(err);
      emailWarning = "Your meeting is booked. The confirmation email could not be sent — use the Meet link below.";
    }

    res.status(201).json({
      message: "Meeting booked",
      meeting: {
        id: String(serviceRequest._id),
        start: slot.start.toISOString(),
        whenLabel,
        meetLink: event.meetLink,
        timezone,
      },
      ...(emailWarning ? { emailWarning } : {}),
    });
  } catch (err) {
    if (createdEventId && refreshToken) {
      await deleteMeetEvent(refreshToken, createdEventId).catch((deleteErr) => console.error(deleteErr));
    }
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      res.status(409).json({ error: "That time is no longer available." });
      return;
    }
    if (err instanceof GoogleAuthError) {
      res.status(503).json({ error: "Online booking is not open yet." });
      return;
    }
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to book the meeting"),
    });
  }
};

export const getBookingAdminSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getBookingSettings();
    let connected = Boolean(settings.googleRefreshToken);
    let needsReconnect = false;
    let email = settings.googleAccountEmail || "";
    if (connected && googleOAuthConfigured()) {
      try {
        const liveEmail = await primaryCalendarEmail(settings.googleRefreshToken);
        if (liveEmail && liveEmail !== settings.googleAccountEmail) {
          settings.googleAccountEmail = liveEmail;
          await settings.save();
          email = liveEmail;
        }
      } catch (err) {
        if (err instanceof GoogleAuthError) {
          connected = false;
          needsReconnect = true;
        } else {
          console.error(err);
        }
      }
    } else if (!googleOAuthConfigured()) {
      connected = false;
    }

    res.status(200).json({
      settings: {
        timezone: settings.timezone || BOOKING_TIMEZONE,
        slotMinutes: settings.slotMinutes,
        horizonDays: settings.horizonDays,
        week: publicWeek(settings.week),
      },
      google: {
        configured: googleOAuthConfigured(),
        connected,
        needsReconnect,
        email,
      },
      email: {
        configured: resendConfigured(),
        from: process.env.RESEND_FROM?.trim() || "Xaeon <info@xaeons.com>",
        notify: notifyEmails(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to load booking settings"),
    });
  }
};

export const putBookingAdminSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.settings as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "settings object is required" });
      return;
    }

    const slotMinutes = Number(body.slotMinutes);
    const horizonDays = Number(body.horizonDays);
    if (!SLOT_LENGTHS.includes(slotMinutes)) {
      res.status(400).json({ error: "Slot length must be 15, 20, 30, 45, or 60 minutes." });
      return;
    }
    if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 180) {
      res.status(400).json({ error: "Days ahead must be between 1 and 180." });
      return;
    }
    if (!Array.isArray(body.week) || body.week.length !== 7) {
      res.status(400).json({ error: "A schedule for all seven days is required." });
      return;
    }

    const week: DayWindow[] = [];
    for (const entry of body.week) {
      if (!entry || typeof entry !== "object") {
        res.status(400).json({ error: "Invalid day schedule." });
        return;
      }
      const day = Number((entry as { day?: unknown }).day);
      const start = typeof (entry as { start?: unknown }).start === "string" ? (entry as { start: string }).start : "";
      const end = typeof (entry as { end?: unknown }).end === "string" ? (entry as { end: string }).end : "";
      const enabled = Boolean((entry as { enabled?: unknown }).enabled);
      if (!Number.isInteger(day) || day < 0 || day > 6 || week.some((item) => item.day === day)) {
        res.status(400).json({ error: "Each weekday must appear once." });
        return;
      }
      if (!isValidTime(start) || !isValidTime(end)) {
        res.status(400).json({ error: "Use 24-hour times like 10:00." });
        return;
      }
      week.push({ day, enabled, start, end });
    }

    const settings = await getBookingSettings();
    settings.timezone = BOOKING_TIMEZONE;
    settings.slotMinutes = slotMinutes;
    settings.horizonDays = horizonDays;
    settings.week = week.sort((a, b) => a.day - b.day);
    await settings.save();

    res.status(200).json({
      message: "Saved",
      settings: {
        timezone: settings.timezone,
        slotMinutes: settings.slotMinutes,
        horizonDays: settings.horizonDays,
        week: publicWeek(settings.week),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to save booking settings"),
    });
  }
};

export const startGoogleConnect = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!googleOAuthConfigured()) {
      res.status(400).json({ error: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server." });
      return;
    }
    const origin = frontendOrigin(req.get("referer"));
    const state = jwt.sign({ purpose: "google-calendar", origin }, jwtSecret() as Secret, { expiresIn: "10m" });
    res.redirect(buildGoogleAuthUrl(state));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to start Google connection"),
    });
  }
};

export const googleConnectCallback = async (req: Request, res: Response): Promise<void> => {
  let origin = frontendOrigin();
  try {
    const stateRaw = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const oauthError = typeof req.query.error === "string" ? req.query.error : "";
    const decoded = jwt.verify(stateRaw, jwtSecret() as Secret) as { purpose?: string; origin?: string };
    if (decoded.purpose !== "google-calendar") {
      res.status(400).send("Invalid Google connection state");
      return;
    }
    origin = frontendOrigin(decoded.origin);
    if (oauthError || !code) {
      res.redirect(`${origin}/admin/bookings?google=error&reason=${encodeURIComponent(oauthError || "missing_code")}`);
      return;
    }
    const exchanged = await exchangeGoogleCode(code);
    const settings = await getBookingSettings();
    settings.googleRefreshToken = exchanged.refreshToken;
    settings.googleAccountEmail = exchanged.email;
    await settings.save();
    res.redirect(`${origin}/admin/bookings?google=connected`);
  } catch (err) {
    console.error(err);
    const reason = err instanceof Error ? err.message : "google_connect_failed";
    res.redirect(`${origin}/admin/bookings?google=error&reason=${encodeURIComponent(reason.slice(0, 180))}`);
  }
};

export const disconnectGoogle = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getBookingSettings();
    settings.googleRefreshToken = "";
    settings.googleAccountEmail = "";
    await settings.save();
    res.status(200).json({ message: "Google Calendar disconnected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to disconnect Google Calendar"),
    });
  }
};
