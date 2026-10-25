"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendConfigured = void 0;
exports.notifyEmails = notifyEmails;
exports.sendBookingEmails = sendBookingEmails;
exports.sendEnquiryNotice = sendEnquiryNotice;
const resend_1 = require("resend");
const email_1 = require("./email");
Object.defineProperty(exports, "resendConfigured", { enumerable: true, get: function () { return email_1.resendConfigured; } });
const attribution_1 = require("../utils/attribution");
function notifyEmails() {
    const raw = process.env.BOOKING_NOTIFY_EMAILS?.trim();
    const list = raw
        ? raw.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"))
        : [];
    if (list.length === 0)
        console.warn("BOOKING_NOTIFY_EMAILS is not set; staff will not be notified");
    return [...new Set(list)];
}
function safeLink(url) {
    return url.startsWith("https://") ? url : "";
}
function detailsRows(details) {
    const rows = [
        ["When", details.whenLabel],
        ["Name", details.name],
        ["Email", details.email],
        ["Phone", details.phone],
    ];
    if (details.company)
        rows.push(["Company", details.company]);
    if (details.packageTitle)
        rows.push(["Package", details.packageTitle]);
    rows.push(["Message", details.message]);
    rows.push(...(0, attribution_1.attributionRows)(details.attribution));
    return rows
        .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">${(0, email_1.escapeHtml)(label)}</td><td style="padding:8px 0;color:#111827;">${(0, email_1.escapeHtml)(value)}</td></tr>`)
        .join("");
}
async function sendBookingEmails(details) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey)
        throw new Error("RESEND_API_KEY is not set");
    const resend = new resend_1.Resend(apiKey);
    const link = safeLink(details.meetLink);
    const meetButton = link
        ? `<p style="margin:24px 0;"><a href="${(0, email_1.escapeHtml)(link)}" style="background:#72c04f;color:#0b1207;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block;">Join Google Meet</a></p><p style="color:#374151;word-break:break-all;">${(0, email_1.escapeHtml)(link)}</p>`
        : "";
    const clientHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <p>Hi ${(0, email_1.escapeHtml)(details.name)},</p>
      <p>Your consultation with Xaeon is confirmed.</p>
      <p><strong>${(0, email_1.escapeHtml)(details.whenLabel)}</strong></p>
      ${meetButton}
      <p>You also have a calendar invite for this Google Meet. A short recap of what you sent us:</p>
      <p style="white-space:pre-wrap;">${(0, email_1.escapeHtml)(details.message)}</p>
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
        from: (0, email_1.fromAddress)(),
        to: details.email,
        subject: "Your Xaeon Google Meet is confirmed",
        html: clientHtml,
    });
    if (clientResult.error) {
        throw new Error(clientResult.error.message);
    }
    const staff = notifyEmails().filter((email) => email !== details.email.toLowerCase());
    if (staff.length === 0)
        return;
    const staffResult = await resend.emails.send({
        from: (0, email_1.fromAddress)(),
        to: staff,
        replyTo: details.email,
        subject: `New Google Meet booking — ${details.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
        html: staffHtml,
    });
    if (staffResult.error) {
        throw new Error(staffResult.error.message);
    }
}
async function sendEnquiryNotice(details) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey)
        throw new Error("RESEND_API_KEY is not set");
    const sourceLabel = details.source === "package"
        ? "Package enquiry"
        : details.source === "service"
            ? "Service enquiry"
            : details.source === "product"
                ? "Product demo request"
                : "Contact form";
    const rows = [
        ["From", details.name],
        ["Email", details.email],
        ["Phone", details.phone],
    ];
    if (details.company)
        rows.push(["Company", details.company]);
    if (details.interest)
        rows.push(["About", details.interest]);
    rows.push(["Message", details.message]);
    rows.push(...(0, attribution_1.attributionRows)(details.attribution));
    const table = rows
        .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">${(0, email_1.escapeHtml)(label)}</td><td style="padding:8px 0;color:#111827;white-space:pre-wrap;">${(0, email_1.escapeHtml)(value)}</td></tr>`)
        .join("");
    const to = notifyEmails();
    if (to.length === 0)
        return;
    const resend = new resend_1.Resend(apiKey);
    const result = await resend.emails.send({
        from: (0, email_1.fromAddress)(),
        to,
        replyTo: details.email,
        subject: `New message from ${details.name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <p>Someone sent a message through the Xaeon ${(0, email_1.escapeHtml)(sourceLabel.toLowerCase())}.</p>
        <table style="border-collapse:collapse;">${table}</table>
      </div>
    `,
    });
    if (result.error) {
        throw new Error(result.error.message);
    }
}
