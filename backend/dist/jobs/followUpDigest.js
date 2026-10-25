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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFollowUpDigest = sendFollowUpDigest;
exports.startFollowUpDigest = startFollowUpDigest;
const mongoose_1 = __importDefault(require("mongoose"));
const jobState_model_1 = __importDefault(require("../models/jobState.model"));
const serviceRequest_model_1 = __importStar(require("../models/serviceRequest.model"));
const bookingEmail_1 = require("../services/bookingEmail");
const email_1 = require("../services/email");
const invite_1 = require("../services/invite");
const JOB_KEY = "follow-up-digest";
const SEND_HOUR_CAIRO = 8;
const CHECK_EVERY_MS = 15 * 60 * 1000;
function cairoNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
/** Builds and sends the morning digest of follow-ups due today, overdue ones and new unassigned leads. */
async function sendFollowUpDigest() {
    const now = new Date();
    const endOfToday = new Date(now.getTime() + 24 * 3600000);
    const [due, overdue, fresh] = await Promise.all([
        serviceRequest_model_1.default.find({ stage: { $in: serviceRequest_model_1.OPEN_STAGES }, followUpAt: { $gte: now, $lt: endOfToday } })
            .select("contactName company title followUpAt owner").populate("owner", "name").sort({ followUpAt: 1 }).limit(50).lean(),
        serviceRequest_model_1.default.find({ stage: { $in: serviceRequest_model_1.OPEN_STAGES }, followUpAt: { $lt: now } })
            .select("contactName company title followUpAt owner").populate("owner", "name").sort({ followUpAt: 1 }).limit(50).lean(),
        serviceRequest_model_1.default.find({ stage: "new", owner: { $exists: false }, createdAt: { $gte: new Date(now.getTime() - 3 * 86400000) } })
            .select("contactName company title createdAt").sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    if (!due.length && !overdue.length && !fresh.length)
        return { sent: false, due: 0, overdue: 0, fresh: 0 };
    const link = (id) => `${(0, invite_1.appOrigin)()}/admin/leads?lead=${String(id)}`;
    const fmt = (d) => d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(d)) : "";
    const item = (l, extra) => {
        const owner = l.owner?.name;
        return `<li style="margin-bottom:8px;"><a href="${link(l._id)}" style="color:#3d7a26;font-weight:700;">${(0, email_1.escapeHtml)(l.contactName || l.title)}</a>${l.company ? ` · ${(0, email_1.escapeHtml)(l.company)}` : ""}<br><span style="color:#6b7280;font-size:13px;">${(0, email_1.escapeHtml)(extra)}${owner ? ` · ${(0, email_1.escapeHtml)(owner)}` : " · unassigned"}</span></li>`;
    };
    const section = (title, items) => items.length ? `<h3 style="margin:22px 0 8px;font-size:16px;">${title} (${items.length})</h3><ul style="padding-left:18px;margin:0;">${items.join("")}</ul>` : "";
    await (0, email_1.sendEmail)({
        to: (0, bookingEmail_1.notifyEmails)(),
        subject: `Leads today: ${overdue.length} overdue, ${due.length} due, ${fresh.length} new`,
        html: (0, email_1.emailLayout)(`<p>Good morning. Here's what needs attention in the pipeline today.</p>
       ${section("Overdue follow-ups", overdue.map((l) => item(l, `was due ${fmt(l.followUpAt)}`)))}
       ${section("Follow-ups due today", due.map((l) => item(l, `due ${fmt(l.followUpAt)}`)))}
       ${section("New leads without an owner", fresh.map((l) => item({ ...l, owner: undefined }, `arrived ${fmt(l.createdAt)}`)))}
       <p style="margin-top:22px;"><a href="${(0, invite_1.appOrigin)()}/admin/leads" style="color:#3d7a26;">Open the pipeline</a></p>`),
    });
    return { sent: true, due: due.length, overdue: overdue.length, fresh: fresh.length };
}
async function tick() {
    if (mongoose_1.default.connection.readyState !== 1 || !(0, email_1.resendConfigured)() || (0, bookingEmail_1.notifyEmails)().length === 0)
        return;
    const { date, hour } = cairoNow();
    if (hour < SEND_HOUR_CAIRO)
        return;
    // Claim today's run atomically; only one process (or restart) wins.
    const claimed = await jobState_model_1.default.findOneAndUpdate({ key: JOB_KEY, lastRunDate: { $ne: date } }, { $set: { lastRunDate: date } }, { upsert: true, new: true }).catch((err) => {
        if (err?.code === 11000)
            return null; // another process claimed it first
        throw err;
    });
    if (!claimed)
        return;
    const result = await sendFollowUpDigest();
    console.log(`[digest] ${date}: ${result.sent ? "sent" : "nothing to send"} (overdue ${result.overdue}, due ${result.due}, new ${result.fresh})`);
}
/** Checks every 15 minutes; sends at most one digest per Cairo day, after 08:00. */
function startFollowUpDigest() {
    if (process.env.DISABLE_JOBS === "true")
        return;
    const run = () => tick().catch((err) => console.error("[digest] failed:", err));
    setTimeout(run, 60000);
    setInterval(run, CHECK_EVERY_MS).unref();
}
