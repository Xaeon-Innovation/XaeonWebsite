import { Resend } from "resend";
import { escapeHtml, fromAddress, resendConfigured } from "./email";

export { resendConfigured };
import { attributionRows, type Attribution } from "../utils/attribution";
import type { EnquirySource } from "../models/serviceRequest.model";

export function notifyEmails(): string[] {
  const raw = process.env.BOOKING_NOTIFY_EMAILS?.trim();
  const list = raw
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"))
    : [];
  if (list.length === 0) console.warn("BOOKING_NOTIFY_EMAILS is not set; staff will not be notified");
  return [...new Set(list)];
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
  attribution?: Attribution;
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
  rows.push(...attributionRows(details.attribution));
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

export type EnquiryEmailDetails = {
  source: EnquirySource;
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  interest?: string;
  attribution?: Attribution;
};

export async function sendEnquiryNotice(details: EnquiryEmailDetails): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const sourceLabel =
    details.source === "package"
      ? "Package enquiry"
      : details.source === "service"
        ? "Service enquiry"
        : details.source === "product"
          ? "Product demo request"
          : "Contact form";

  const rows: [string, string][] = [
    ["From", details.name],
    ["Email", details.email],
    ["Phone", details.phone],
  ];
  if (details.company) rows.push(["Company", details.company]);
  if (details.interest) rows.push(["About", details.interest]);
  rows.push(["Message", details.message]);
  rows.push(...attributionRows(details.attribution));

  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#111827;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const to = notifyEmails();
  if (to.length === 0) return;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: fromAddress(),
    to,
    replyTo: details.email,
    subject: `New message from ${details.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <p>Someone sent a message through the Xaeon ${escapeHtml(sourceLabel.toLowerCase())}.</p>
        <table style="border-collapse:collapse;">${table}</table>
      </div>
    `,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
}
