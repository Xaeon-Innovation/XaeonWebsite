import { Resend } from "resend";

const DEFAULT_NOTIFY = [
  "mariamelmaghrapy029@gmail.com",
  "realabdelrahmanelasrag@gmail.com",
];

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function notifyEmails(): string[] {
  const raw = process.env.BOOKING_NOTIFY_EMAILS?.trim();
  const list = raw
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"))
    : DEFAULT_NOTIFY;
  return [...new Set(list)];
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "Xaeon <info@xaeons.com>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeLink(url: string): string {
  return url.startsWith("https://") ? url : "";
}

export type BookingEmailDetails = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  whenLabel: string;
  meetLink: string;
  packageTitle?: string;
};

function detailsRows(details: BookingEmailDetails): string {
  const rows: [string, string][] = [
    ["When", details.whenLabel],
    ["Name", details.name],
    ["Email", details.email],
    ["Phone", details.phone],
  ];
  if (details.company) rows.push(["Company", details.company]);
  if (details.packageTitle) rows.push(["Package", details.packageTitle]);
  rows.push(["Message", details.message]);
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#111827;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

export async function sendBookingEmails(details: BookingEmailDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const link = safeLink(details.meetLink);
  const meetButton = link
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(link)}" style="background:#72c04f;color:#0b1207;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block;">Join Google Meet</a></p><p style="color:#374151;word-break:break-all;">${escapeHtml(link)}</p>`
    : "";

  const clientHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <p>Hi ${escapeHtml(details.name)},</p>
      <p>Your consultation with Xaeon is confirmed.</p>
      <p><strong>${escapeHtml(details.whenLabel)}</strong></p>
      ${meetButton}
      <p>You also have a calendar invite for this Google Meet. A short recap of what you sent us:</p>
      <p style="white-space:pre-wrap;">${escapeHtml(details.message)}</p>
      <p>If you need to change the time, reply to this email.</p>
      <p>— Xaeon</p>
    </div>
  `;

  const staffHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <p>A new Google Meet was booked on xaeons.com.</p>
      ${meetButton}
      <table style="border-collapse:collapse;">${detailsRows(details)}</table>
    </div>
  `;

  const clientResult = await resend.emails.send({
    from: fromAddress(),
    to: details.email,
    subject: "Your Xaeon Google Meet is confirmed",
    html: clientHtml,
  });
  if (clientResult.error) {
    throw new Error(clientResult.error.message);
  }

  const staff = notifyEmails().filter((email) => email !== details.email.toLowerCase());
  if (staff.length === 0) return;

  const staffResult = await resend.emails.send({
    from: fromAddress(),
    to: staff,
    replyTo: details.email,
    subject: `New Google Meet booking — ${details.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
    html: staffHtml,
  });
  if (staffResult.error) {
    throw new Error(staffResult.error.message);
  }
}
