"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_TIMEZONE = void 0;
exports.defaultWeek = defaultWeek;
exports.isValidTime = isValidTime;
exports.addDays = addDays;
exports.weekdayOf = weekdayOf;
exports.zonedTimeToUtc = zonedTimeToUtc;
exports.todayInZone = todayInZone;
exports.formatSlotLabel = formatSlotLabel;
exports.monthBounds = monthBounds;
exports.generateSlots = generateSlots;
exports.BOOKING_TIMEZONE = "Africa/Cairo";
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
function defaultWeek() {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        enabled: day >= 1 && day <= 5,
        start: "10:00",
        end: "02:00",
    }));
}
function isValidTime(value) {
    return TIME_RE.test(value);
}
function pad(n) {
    return String(n).padStart(2, "0");
}
function addDays(date, days) {
    const [y, m, d] = date.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d + days));
    return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}
function weekdayOf(date) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function parseMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}
function minutesToHHMM(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${pad(h)}:${pad(m)}`;
}
function zonedParts(instant, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
    });
    const map = {};
    for (const part of dtf.formatToParts(instant)) {
        if (part.type !== "literal")
            map[part.type] = part.value;
    }
    let hour = Number(map.hour);
    if (hour === 24)
        hour = 0;
    const weekdays = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };
    return {
        date: `${map.year}-${map.month}-${map.day}`,
        time: `${pad(hour)}:${map.minute}`,
        weekday: weekdays[map.weekday] ?? 0,
    };
}
/** Offset of `timeZone` at `instant`: local wall clock minus UTC, in milliseconds. */
function timeZoneOffsetMs(instant, timeZone) {
    const parts = zonedParts(instant, timeZone);
    const [y, m, d] = parts.date.split("-").map(Number);
    const [hh, mm] = parts.time.split(":").map(Number);
    const asUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
    return asUtc - instant.getTime();
}
function zonedTimeToUtc(date, time, timeZone) {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);
    const offset = timeZoneOffsetMs(new Date(utcGuess), timeZone);
    let result = utcGuess - offset;
    const offset2 = timeZoneOffsetMs(new Date(result), timeZone);
    if (offset2 !== offset)
        result = utcGuess - offset2;
    return new Date(result);
}
function todayInZone(timeZone, now = new Date()) {
    return zonedParts(now, timeZone).date;
}
function formatSlotLabel(instant, timeZone) {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short",
    }).format(instant);
}
function monthBounds(month) {
    if (!/^\d{4}-\d{2}$/.test(month))
        return null;
    const [y, m] = month.split("-").map(Number);
    if (m < 1 || m > 12)
        return null;
    const fromDate = `${month}-01`;
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
    return { fromDate, toDate: addDays(nextMonth, -1) };
}
/**
 * Slots for each enabled weekday window.
 * A window whose end is earlier than its start continues into the next morning
 * (Monday 10:00–02:00 includes Tuesday 00:00–01:30).
 */
function generateSlots(options) {
    const now = options.now ?? new Date();
    const today = todayInZone(options.timezone, now);
    const lastHorizon = addDays(today, options.horizonDays);
    const windows = new Map(options.week.map((w) => [w.day, w]));
    const slots = [];
    let cursor = addDays(options.fromDate, -1);
    while (cursor <= options.toDate) {
        const window = windows.get(weekdayOf(cursor));
        if (window?.enabled && cursor >= today && cursor <= lastHorizon && isValidTime(window.start) && isValidTime(window.end)) {
            const startMin = parseMinutes(window.start);
            const endMin = parseMinutes(window.end);
            const duration = endMin > startMin ? endMin - startMin : endMin < startMin ? 24 * 60 - startMin + endMin : 0;
            for (let offset = 0; offset + options.slotMinutes <= duration; offset += options.slotMinutes) {
                const absolute = startMin + offset;
                const dayShift = Math.floor(absolute / (24 * 60));
                const minuteOfDay = absolute % (24 * 60);
                const slotDate = addDays(cursor, dayShift);
                if (slotDate < options.fromDate || slotDate > options.toDate)
                    continue;
                const label = minutesToHHMM(minuteOfDay);
                const start = zonedTimeToUtc(slotDate, label, options.timezone);
                if (start.getTime() <= now.getTime())
                    continue;
                const end = new Date(start.getTime() + options.slotMinutes * 60000);
                slots.push({ date: slotDate, start, end, label });
            }
        }
        cursor = addDays(cursor, 1);
    }
    return slots;
}
