import { Resend } from "resend";

/** Shared Resend plumbing for every email the API sends. */

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "Xaeon <info@xaeons.com>";
}

/** Where staff replies should land (defaults to the sender address). */
export function replyToAddress(): string {
  return process.env.RESEND_REPLY_TO?.trim() || "info@xaeons.com";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text (as typed by staff) → safe HTML paragraphs. */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Minimal branded wrapper that renders well in every mail client. */
export function emailLayout(innerHtml: string, dir: "ltr" | "rtl" = "ltr"): string {
  return `<div dir="${dir}" style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:560px;">
${innerHtml}
<p style="margin-top:28px;color:#6b7280;font-size:13px;">Xaeon Software Solutions · xaeons.com · +20 101 597 1869</p>
</div>`;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

/** Sends one email; throws with Resend's message on failure. */
export async function sendEmail(input: SendEmailInput): Promise<{ id?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: fromAddress(),
    to: input.to,
    subject: input.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });
  if (result.error) throw new Error(result.error.message);
  return { id: result.data?.id };
}
