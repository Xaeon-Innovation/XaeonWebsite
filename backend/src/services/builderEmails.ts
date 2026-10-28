import type { IBuilderOrder } from "../models/builderOrder.model";
import { attributionRows } from "../utils/attribution";
import { notifyEmails } from "./bookingEmail";
import { emailLayout, escapeHtml, replyToAddress, sendEmail } from "./email";

/** Emails for Website Builder orders: staff notice, customer confirmation, payment received. */

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

function rowsTable(rows: [string, string][]): string {
  return `<table style="border-collapse:collapse;">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#111827;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`
    )
    .join("")}</table>`;
}

function quoteRows(order: IBuilderOrder): [string, string][] {
  const q = order.quote;
  const rows: [string, string][] = q.lines.map((l) => [
    l.label,
    l.included ? "Included" : `${formatMoney(l.setup, q.currency)}${l.quoted ? " (from)" : ""}${l.monthly ? ` + ${formatMoney(l.monthly, q.currency)}/mo` : ""}${l.discount ? ` (saved ${formatMoney(l.discount, q.currency)})` : ""}`,
  ]);
  rows.push(["Setup total", formatMoney(q.setup, q.currency)]);
  rows.push(["Monthly", `${formatMoney(q.monthly, q.currency)}${q.billing === "annual" ? ` (annual: ${formatMoney(q.annual, q.currency)}/yr)` : ""}`]);
  rows.push(["Deposit", formatMoney(q.deposit, q.currency)]);
  return rows;
}

export async function sendBuilderOrderNotice(order: IBuilderOrder): Promise<void> {
  const to = notifyEmails();
  if (to.length === 0) return;
  const rows: [string, string][] = [
    ["Order", order.ref],
    ["Business", `${order.brand.businessName} · ${order.country} · ${order.market}`],
    ["Contact", `${order.contact.name} · ${order.contact.email} · ${order.contact.phone}`],
    ["Category", order.config.category + (order.config.goal ? ` (goal: ${order.config.goal})` : "")],
    ["Template", order.config.templateSlug],
    ["Plan", `${order.config.planTier} · billed ${order.config.billing}`],
    ["Brand", `${order.brand.primary} / ${order.brand.accent} · font ${order.brand.font}${order.brand.tone ? ` · tone ${order.brand.tone}` : ""}`],
  ];
  if (order.brand.logoUrl) rows.push(["Logo", order.brand.logoUrl]);
  if (order.brand.assetUrls.length) rows.push(["Assets", order.brand.assetUrls.join("\n")]);
  if (order.brand.notes) rows.push(["Notes", order.brand.notes]);
  rows.push(["Status", order.status]);
  rows.push(...attributionRows(order.attribution));

  await sendEmail({
    to,
    replyTo: order.contact.email,
    subject: `New website order ${order.ref} — ${order.brand.businessName}`,
    html: emailLayout(`<p>A new Website Builder order came in.</p>${rowsTable(rows)}<h3>Quote</h3>${rowsTable(quoteRows(order))}`),
  });
}

export async function sendBuilderOrderConfirmation(order: IBuilderOrder): Promise<void> {
  const first = escapeHtml(order.contact.name.trim().split(/\s+/)[0] || order.contact.name);
  const ref = escapeHtml(order.ref);
  const biz = escapeHtml(order.brand.businessName);
  const setup = escapeHtml(formatMoney(order.quote.setup, order.quote.currency));
  const monthly = escapeHtml(formatMoney(order.quote.monthly, order.quote.currency));
  if (order.locale === "ar") {
    await sendEmail({
      to: order.contact.email,
      replyTo: replyToAddress(),
      subject: `استلمنا طلب موقعك ${order.ref} — Xaeon`,
      html: emailLayout(
        `<p>مرحبًا ${first}،</p>
         <p>شكرًا لاختيارك Xaeon لبناء موقع <strong>${biz}</strong>. رقم طلبك <strong dir="ltr">${ref}</strong>.</p>
         <p>التكلفة المبدئية: <span dir="ltr">${setup}</span> مرة واحدة و<span dir="ltr">${monthly}</span> شهريًا.</p>
         <p>سيتواصل معك فريقنا خلال يوم عمل واحد لمراجعة المحتوى والخطوات التالية. أهلًا بك في مجرّتنا ✦</p>
         <p>— فريق Xaeon</p>`,
        "rtl"
      ),
    });
    return;
  }
  await sendEmail({
    to: order.contact.email,
    replyTo: replyToAddress(),
    subject: `We received your website order ${order.ref} — Xaeon`,
    html: emailLayout(
      `<p>Hi ${first},</p>
       <p>Thanks for choosing Xaeon to build the <strong>${biz}</strong> website. Your order reference is <strong>${ref}</strong>.</p>
       <p>Estimated price: ${setup} one-time and ${monthly} per month.</p>
       <p>Our team will contact you within one business day to review your content and next steps. Welcome to our galaxy ✦</p>
       <p>— The Xaeon team</p>`
    ),
  });
}

export async function sendBuilderPaymentReceived(order: IBuilderOrder): Promise<void> {
  const paid = order.payment.amount ?? order.quote.deposit;
  const currency = order.payment.currency ?? order.quote.currency;
  // Converted charges keep cents (e.g. USD 1,234.56); same-currency deposits are whole numbers.
  const amount = currency === order.quote.currency ? formatMoney(paid, currency) : `${currency} ${paid.toFixed(2)}`;
  const results = await Promise.allSettled([
    sendEmail({
      to: notifyEmails(),
      subject: `Deposit paid: ${order.ref} — ${order.brand.businessName}`,
      html: emailLayout(`<p>${escapeHtml(amount)} received via ${escapeHtml(order.payment.provider ?? "manual")} for order <strong>${escapeHtml(order.ref)}</strong>.</p>`),
    }),
    sendEmail({
      to: order.contact.email,
      replyTo: replyToAddress(),
      subject: order.locale === "ar" ? `تم استلام الدفعة — ${order.ref}` : `Payment received — ${order.ref}`,
      html:
        order.locale === "ar"
          ? emailLayout(`<p>استلمنا دفعتك <span dir="ltr">${escapeHtml(amount)}</span> للطلب <strong dir="ltr">${escapeHtml(order.ref)}</strong>. بدأنا العمل على موقعك!</p><p>— فريق Xaeon</p>`, "rtl")
          : emailLayout(`<p>We received your payment of ${escapeHtml(amount)} for order <strong>${escapeHtml(order.ref)}</strong>. Work on your website has started!</p><p>— The Xaeon team</p>`),
    }),
  ]);
  for (const r of results) if (r.status === "rejected") console.error(r.reason);
}
