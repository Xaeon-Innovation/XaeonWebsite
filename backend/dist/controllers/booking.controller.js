"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectGoogle = exports.googleConnectCallback = exports.startGoogleConnect = exports.putBookingAdminSettings = exports.getBookingAdminSettings = exports.createBooking = exports.getAvailability = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const package_model_1 = __importDefault(require("../models/package.model"));
const serviceRequest_model_1 = __importDefault(require("../models/serviceRequest.model"));
const bookingSettings_model_1 = require("../models/bookingSettings.model");
const bookingEmail_1 = require("../services/bookingEmail");
const googleCalendar_1 = require("../services/googleCalendar");
const bookingSlots_1 = require("../utils/bookingSlots");
const serverError_1 = require("../utils/serverError");
const attribution_1 = require("../utils/attribution");
const SLOT_LENGTHS = [15, 20, 30, 45, 60];
function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not set");
    return secret;
}
function allowedOrigins() {
    return (process.env.CORS_ORIGIN ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
function frontendOrigin(preferred) {
    const allowed = allowedOrigins();
    const localDev = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
    if (preferred) {
        try {
            const origin = new URL(preferred).origin;
            const devOk = process.env.NODE_ENV !== "production" && localDev.has(origin);
            if (devOk || allowed.length === 0 || allowed.includes(origin))
                return origin;
        }
        catch {
            /* ignore invalid origin */
        }
    }
    const explicit = process.env.FRONTEND_URL?.trim();
    if (explicit)
        return explicit.replace(/\/$/, "");
    if (allowed[0])
        return allowed[0];
    return "http://localhost:5173";
}
function publicWeek(week) {
    return [...week]
        .sort((a, b) => a.day - b.day)
        .map((day) => ({
        day: day.day,
        enabled: day.enabled,
        start: day.start,
        end: day.end,
    }));
}
function slotsForSettings(settings, fromDate, toDate, now = new Date()) {
    return (0, bookingSlots_1.generateSlots)({
        timezone: settings.timezone || bookingSlots_1.BOOKING_TIMEZONE,
        slotMinutes: settings.slotMinutes,
        horizonDays: settings.horizonDays,
        week: settings.week,
        fromDate,
        toDate,
        now,
    });
}
function overlapsBusy(start, end, busy) {
    const a = start.getTime();
    const b = end.getTime();
    return busy.some((block) => a < block.end.getTime() && b > block.start.getTime());
}
const getAvailability = async (req, res) => {
    try {
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        const timezone = settings.timezone || bookingSlots_1.BOOKING_TIMEZONE;
        const monthParam = typeof req.query.month === "string" ? req.query.month : "";
        const month = /^\d{4}-\d{2}$/.test(monthParam)
            ? monthParam
            : (0, bookingSlots_1.todayInZone)(timezone).slice(0, 7);
        const bounds = (0, bookingSlots_1.monthBounds)(month);
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
        if (!settings.googleRefreshToken || !(0, googleCalendar_1.googleOAuthConfigured)() || !(0, bookingEmail_1.resendConfigured)()) {
            res.status(200).json({ ...base, open: false, reason: "not_connected", dates: {} });
            return;
        }
        const slots = slotsForSettings(settings, bounds.fromDate, bounds.toDate);
        let busy = [];
        if (slots.length > 0) {
            const timeMin = slots[0].start;
            const timeMax = slots[slots.length - 1].end;
            try {
                busy = await (0, googleCalendar_1.listBusy)(settings.googleRefreshToken, timeMin, timeMax, timezone);
            }
            catch (err) {
                if (err instanceof googleCalendar_1.GoogleAuthError) {
                    res.status(200).json({ ...base, open: false, reason: "not_connected", dates: {} });
                    return;
                }
                console.error(err);
                res.status(200).json({ ...base, open: false, reason: "unavailable", dates: {} });
                return;
            }
        }
        const taken = slots.length
            ? await serviceRequest_model_1.default.find({
                source: "booking",
                status: { $in: ["Pending Review", "Accepted"] },
                meeting_date: { $in: slots.map((slot) => slot.start) },
            }).select("meeting_date")
            : [];
        const takenMs = new Set(taken
            .map((row) => row.meeting_date?.getTime())
            .filter((ms) => typeof ms === "number"));
        const dates = {};
        for (const slot of slots) {
            if (takenMs.has(slot.start.getTime()))
                continue;
            if (overlapsBusy(slot.start, slot.end, busy))
                continue;
            const list = dates[slot.date] ?? [];
            list.push({ start: slot.start.toISOString(), label: slot.label });
            dates[slot.date] = list;
        }
        res.status(200).json({ ...base, open: true, reason: null, dates });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to load availability"),
        });
    }
};
exports.getAvailability = getAvailability;
const createBooking = async (req, res) => {
    let createdEventId = "";
    let refreshToken = "";
    try {
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        if (!settings.googleRefreshToken || !(0, googleCalendar_1.googleOAuthConfigured)() || !(0, bookingEmail_1.resendConfigured)()) {
            res.status(503).json({ error: "Online booking is not open yet." });
            return;
        }
        refreshToken = settings.googleRefreshToken;
        const body = req.body;
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
        const message = typeof body?.message === "string" ? body.message.trim() : "";
        const company = typeof body?.company === "string" && body.company.trim() !== ""
            ? body.company.trim()
            : undefined;
        const slotRaw = typeof body?.slot === "string" ? body.slot.trim() : "";
        const attribution = (0, attribution_1.parseAttribution)(body?.attribution);
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
        const timezone = settings.timezone || bookingSlots_1.BOOKING_TIMEZONE;
        const slotDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(slotStart);
        const matches = slotsForSettings(settings, slotDate, slotDate).filter((slot) => slot.start.getTime() === slotStart.getTime());
        const slot = matches[0];
        if (!slot) {
            res.status(409).json({ error: "That time is no longer available." });
            return;
        }
        const clash = await serviceRequest_model_1.default.findOne({
            source: "booking",
            status: { $in: ["Pending Review", "Accepted"] },
            meeting_date: slot.start,
        }).select("_id");
        if (clash) {
            res.status(409).json({ error: "That time is no longer available." });
            return;
        }
        const busy = await (0, googleCalendar_1.listBusy)(refreshToken, slot.start, slot.end, timezone);
        if (overlapsBusy(slot.start, slot.end, busy)) {
            res.status(409).json({ error: "That time is no longer available." });
            return;
        }
        let packageId;
        let packageTitle;
        const packageIdRaw = typeof body?.packageId === "string" ? body.packageId.trim() : "";
        if (packageIdRaw) {
            if (!mongoose_1.default.Types.ObjectId.isValid(packageIdRaw)) {
                res.status(400).json({ error: "Package not found" });
                return;
            }
            const pkg = await package_model_1.default.findById(packageIdRaw);
            if (!pkg) {
                res.status(400).json({ error: "Package not found" });
                return;
            }
            packageId = new mongoose_1.default.Types.ObjectId(packageIdRaw);
            packageTitle = pkg.title?.trim() || "Package";
        }
        const attendees = [...new Set([email, ...(0, bookingEmail_1.notifyEmails)()])];
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
        const event = await (0, googleCalendar_1.createMeetEvent)({
            refreshToken,
            summary: `Xaeon consultation — ${name}`,
            description,
            start: slot.start,
            end: slot.end,
            timeZone: timezone,
            attendees,
        });
        createdEventId = event.eventId;
        const whenLabel = (0, bookingSlots_1.formatSlotLabel)(slot.start, timezone);
        const serviceRequest = await serviceRequest_model_1.default.create({
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
        let emailWarning;
        try {
            await (0, bookingEmail_1.sendBookingEmails)({
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
        }
        catch (err) {
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
    }
    catch (err) {
        if (createdEventId && refreshToken) {
            await (0, googleCalendar_1.deleteMeetEvent)(refreshToken, createdEventId).catch((deleteErr) => console.error(deleteErr));
        }
        if (err && typeof err === "object" && "code" in err && err.code === 11000) {
            res.status(409).json({ error: "That time is no longer available." });
            return;
        }
        if (err instanceof googleCalendar_1.GoogleAuthError) {
            res.status(503).json({ error: "Online booking is not open yet." });
            return;
        }
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to book the meeting"),
        });
    }
};
exports.createBooking = createBooking;
const getBookingAdminSettings = async (_req, res) => {
    try {
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        let connected = Boolean(settings.googleRefreshToken);
        let needsReconnect = false;
        let email = settings.googleAccountEmail || "";
        if (connected && (0, googleCalendar_1.googleOAuthConfigured)()) {
            try {
                const liveEmail = await (0, googleCalendar_1.primaryCalendarEmail)(settings.googleRefreshToken);
                if (liveEmail && liveEmail !== settings.googleAccountEmail) {
                    settings.googleAccountEmail = liveEmail;
                    await settings.save();
                    email = liveEmail;
                }
            }
            catch (err) {
                if (err instanceof googleCalendar_1.GoogleAuthError) {
                    connected = false;
                    needsReconnect = true;
                }
                else {
                    console.error(err);
                }
            }
        }
        else if (!(0, googleCalendar_1.googleOAuthConfigured)()) {
            connected = false;
        }
        res.status(200).json({
            settings: {
                timezone: settings.timezone || bookingSlots_1.BOOKING_TIMEZONE,
                slotMinutes: settings.slotMinutes,
                horizonDays: settings.horizonDays,
                week: publicWeek(settings.week),
            },
            google: {
                configured: (0, googleCalendar_1.googleOAuthConfigured)(),
                connected,
                needsReconnect,
                email,
            },
            email: {
                configured: (0, bookingEmail_1.resendConfigured)(),
                from: process.env.RESEND_FROM?.trim() || "Xaeon <info@xaeons.com>",
                notify: (0, bookingEmail_1.notifyEmails)(),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to load booking settings"),
        });
    }
};
exports.getBookingAdminSettings = getBookingAdminSettings;
const putBookingAdminSettings = async (req, res) => {
    try {
        const body = req.body?.settings;
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
        const week = [];
        for (const entry of body.week) {
            if (!entry || typeof entry !== "object") {
                res.status(400).json({ error: "Invalid day schedule." });
                return;
            }
            const day = Number(entry.day);
            const start = typeof entry.start === "string" ? entry.start : "";
            const end = typeof entry.end === "string" ? entry.end : "";
            const enabled = Boolean(entry.enabled);
            if (!Number.isInteger(day) || day < 0 || day > 6 || week.some((item) => item.day === day)) {
                res.status(400).json({ error: "Each weekday must appear once." });
                return;
            }
            if (!(0, bookingSlots_1.isValidTime)(start) || !(0, bookingSlots_1.isValidTime)(end)) {
                res.status(400).json({ error: "Use 24-hour times like 10:00." });
                return;
            }
            week.push({ day, enabled, start, end });
        }
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        settings.timezone = bookingSlots_1.BOOKING_TIMEZONE;
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to save booking settings"),
        });
    }
};
exports.putBookingAdminSettings = putBookingAdminSettings;
const startGoogleConnect = async (req, res) => {
    try {
        if (!(0, googleCalendar_1.googleOAuthConfigured)()) {
            res.status(400).json({ error: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI on the server." });
            return;
        }
        const origin = frontendOrigin(req.get("referer"));
        const state = jsonwebtoken_1.default.sign({ purpose: "google-calendar", origin }, jwtSecret(), { expiresIn: "10m" });
        res.redirect((0, googleCalendar_1.buildGoogleAuthUrl)(state));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to start Google connection"),
        });
    }
};
exports.startGoogleConnect = startGoogleConnect;
const googleConnectCallback = async (req, res) => {
    let origin = frontendOrigin();
    try {
        const stateRaw = typeof req.query.state === "string" ? req.query.state : "";
        const code = typeof req.query.code === "string" ? req.query.code : "";
        const oauthError = typeof req.query.error === "string" ? req.query.error : "";
        const decoded = jsonwebtoken_1.default.verify(stateRaw, jwtSecret());
        if (decoded.purpose !== "google-calendar") {
            res.status(400).send("Invalid Google connection state");
            return;
        }
        origin = frontendOrigin(decoded.origin);
        if (oauthError || !code) {
            res.redirect(`${origin}/admin/bookings?google=error&reason=${encodeURIComponent(oauthError || "missing_code")}`);
            return;
        }
        const exchanged = await (0, googleCalendar_1.exchangeGoogleCode)(code);
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        settings.googleRefreshToken = exchanged.refreshToken;
        settings.googleAccountEmail = exchanged.email;
        await settings.save();
        res.redirect(`${origin}/admin/bookings?google=connected`);
    }
    catch (err) {
        console.error(err);
        const reason = err instanceof Error ? err.message : "google_connect_failed";
        res.redirect(`${origin}/admin/bookings?google=error&reason=${encodeURIComponent(reason.slice(0, 180))}`);
    }
};
exports.googleConnectCallback = googleConnectCallback;
const disconnectGoogle = async (_req, res) => {
    try {
        const settings = await (0, bookingSettings_model_1.getBookingSettings)();
        settings.googleRefreshToken = "";
        settings.googleAccountEmail = "";
        await settings.save();
        res.status(200).json({ message: "Google Calendar disconnected" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to disconnect Google Calendar"),
        });
    }
};
exports.disconnectGoogle = disconnectGoogle;
