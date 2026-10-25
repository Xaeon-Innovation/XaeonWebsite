import mongoose from "mongoose";
import JobState from "../models/jobState.model";
import ServiceRequest, { OPEN_STAGES } from "../models/serviceRequest.model";
import { notifyEmails } from "../services/bookingEmail";
import { emailLayout, escapeHtml, resendConfigured, sendEmail } from "../services/email";
import { appOrigin } from "../services/invite";

const JOB_KEY = "follow-up-digest";
const SEND_HOUR_CAIRO = 8;
const CHECK_EVERY_MS = 15 * 60 * 1000;

function cairoNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

/** Builds and sends the morning digest of follow-ups due today, overdue ones and new unassigned leads. */
export async function sendFollowUpDigest(): Promise<{ sent: boolean; due: number; overdue: number; fresh: number }> {
  const now = new Date();
  const endOfToday = new Date(now.getTime() + 24 * 3_600_000);
  const [due, overdue, fresh] = await Promise.all([
    ServiceRequest.find({ stage: { $in: OPEN_STAGES }, followUpAt: { $gte: now, $lt: endOfToday } })
      .select("contactName company title followUpAt owner").populate("owner", "name").sort({ followUpAt: 1 }).limit(50).lean(),
    ServiceRequest.find({ stage: { $in: OPEN_STAGES }, followUpAt: { $lt: now } })
      .select("contactName company title followUpAt owner").populate("owner", "name").sort({ followUpAt: 1 }).limit(50).lean(),
    ServiceRequest.find({ stage: "new", owner: { $exists: false }, createdAt: { $gte: new Date(now.getTime() - 3 * 86_400_000) } })
      .select("contactName company title createdAt").sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  if (!due.length && !overdue.length && !fresh.length) return { sent: false, due: 0, overdue: 0, fresh: 0 };

  const link = (id: unknown) => `${appOrigin()}/admin/leads?lead=${String(id)}`;
  const fmt = (d?: Date | null) =>
    d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(d)) : "";
  const item = (l: { _id: unknown; contactName?: string; company?: string; title: string; owner?: unknown }, extra: string) => {
    const owner = (l.owner as { name?: string } | undefined)?.name;
    return `<li style="margin-bottom:8px;"><a href="${link(l._id)}" style="color:#3d7a26;font-weight:700;">${escapeHtml(l.contactName || l.title)}</a>${
      l.company ? ` · ${escapeHtml(l.company)}` : ""
    }<br><span style="color:#6b7280;font-size:13px;">${escapeHtml(extra)}${owner ? ` · ${escapeHtml(owner)}` : " · unassigned"}</span></li>`;
  };
  const section = (title: string, items: string[]) =>
    items.length ? `<h3 style="margin:22px 0 8px;font-size:16px;">${title} (${items.length})</h3><ul style="padding-left:18px;margin:0;">${items.join("")}</ul>` : "";

  await sendEmail({
    to: notifyEmails(),
    subject: `Leads today: ${overdue.length} overdue, ${due.length} due, ${fresh.length} new`,
    html: emailLayout(
      `<p>Good morning. Here's what needs attention in the pipeline today.</p>
       ${section("Overdue follow-ups", overdue.map((l) => item(l, `was due ${fmt(l.followUpAt)}`)))}
       ${section("Follow-ups due today", due.map((l) => item(l, `due ${fmt(l.followUpAt)}`)))}
       ${section("New leads without an owner", fresh.map((l) => item({ ...l, owner: undefined }, `arrived ${fmt(l.createdAt)}`)))}
       <p style="margin-top:22px;"><a href="${appOrigin()}/admin/leads" style="color:#3d7a26;">Open the pipeline</a></p>`,
    ),
  });
  return { sent: true, due: due.length, overdue: overdue.length, fresh: fresh.length };
}

async function tick(): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !resendConfigured() || notifyEmails().length === 0) return;
  const { date, hour } = cairoNow();
  if (hour < SEND_HOUR_CAIRO) return;
  // Claim today's run atomically; only one process (or restart) wins.
  const claimed = await JobState.findOneAndUpdate(
    { key: JOB_KEY, lastRunDate: { $ne: date } },
    { $set: { lastRunDate: date } },
    { upsert: true, new: true },
  ).catch((err: { code?: number }) => {
    if (err?.code === 11000) return null; // another process claimed it first
    throw err;
  });
  if (!claimed) return;
  const result = await sendFollowUpDigest();
  console.log(`[digest] ${date}: ${result.sent ? "sent" : "nothing to send"} (overdue ${result.overdue}, due ${result.due}, new ${result.fresh})`);
}

/** Checks every 15 minutes; sends at most one digest per Cairo day, after 08:00. */
export function startFollowUpDigest(): void {
  if (process.env.DISABLE_JOBS === "true") return;
  const run = () => tick().catch((err) => console.error("[digest] failed:", err));
  setTimeout(run, 60_000);
  setInterval(run, CHECK_EVERY_MS).unref();
}
