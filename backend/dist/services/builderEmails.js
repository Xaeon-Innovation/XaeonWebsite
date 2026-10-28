"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMoney = formatMoney;
exports.sendBuilderOrderNotice = sendBuilderOrderNotice;
exports.sendBuilderOrderConfirmation = sendBuilderOrderConfirmation;
exports.sendBuilderPaymentReceived = sendBuilderPaymentReceived;
const attribution_1 = require("../utils/attribution");
const bookingEmail_1 = require("./bookingEmail");
const email_1 = require("./email");
/** Emails for Website Builder orders: staff notice, customer confirmation, payment received. */
function formatMoney(amount, currency) {
    return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}
function rowsTable(rows) {
    return `<table style="border-collapse:collapse;">${rows
        .map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;">${(0, email_1.escapeHtml)(label)}</td><td style="padding:6px 0;color:#111827;white-space:pre-wrap;">${(0, email_1.escapeHtml)(value)}</td></tr>`)
        .join("")}</table>`;
}
function quoteRows(order) {
    const q = order.quote;
    const rows = q.lines.map((l) => [
        l.label,
        l.included ? "Included" : `${formatMoney(l.setup, q.currency)}${l.quoted ? " (from)" : ""}${l.monthly ? ` + ${formatMoney(l.monthly, q.currency)}/mo` : ""}${l.discount ? ` (saved ${formatMoney(l.discount, q.currency)})` : ""}`,
    ]);
    rows.push(["Setup total", formatMoney(q.setup, q.currency)]);
    rows.push(["Monthly", `${formatMoney(q.monthly, q.currency)}${q.billing === "annual" ? ` (annual: ${formatMoney(q.annual, q.currency)}/yr)` : ""}`]);
    rows.push(["Deposit", formatMoney(q.deposit, q.currency)]);
    return rows;
}
async function sendBuilderOrderNotice(order) {
    const to = (0, bookingEmail_1.notifyEmails)();
    if (to.length === 0)
        return;
    const rows = [
        ["Order", order.ref],
        ["Business", `${order.brand.businessName} · ${order.country} · ${order.market}`],
        ["Contact", `${order.contact.name} · ${order.contact.email} · ${order.contact.phone}`],
        ["Category", order.config.category + (order.config.goal ? ` (goal: ${order.config.goal})` : "")],
        ["Template", order.config.templateSlug],
        ["Pages", (order.config.pages ?? []).join(", ") || "—"],
        ["Plan", `${order.config.planTier} · billed ${order.config.billing}`],
        ["Brand", `${order.brand.primary} / ${order.brand.accent} · font ${order.brand.font} · ${order.brand.mode ?? "light"} · ${order.brand.corners ?? "soft"} corners${order.brand.tone ? ` · tone ${order.brand.tone}` : ""}`],
    ];
    if (order.brand.logoUrl)
        rows.push(["Logo", order.brand.logoUrl]);
    if (order.brand.assetUrls.length)
        rows.push(["Assets", order.brand.assetUrls.join("\n")]);
    if (order.brand.notes)
        rows.push(["Notes", order.brand.notes]);
    rows.push(["Status", order.status]);
    rows.push(...(0, attribution_1.attributionRows)(order.attribution));
    await (0, email_1.sendEmail)({
        to,
        replyTo: order.contact.email,
        subject: `New website order ${order.ref} — ${order.brand.businessName}`,
        html: (0, email_1.emailLayout)(`<p>A new Website Builder order came in.</p>${rowsTable(rows)}<h3>Quote</h3>${rowsTable(quoteRows(order))}`),
    });
}
async function sendBuilderOrderConfirmation(order) {
    const first = (0, email_1.escapeHtml)(order.contact.name.trim().split(/\s+/)[0] || order.contact.name);
    const ref = (0, email_1.escapeHtml)(order.ref);
    const biz = (0, email_1.escapeHtml)(order.brand.businessName);
    const setup = (0, email_1.escapeHtml)(formatMoney(order.quote.setup, order.quote.currency));
    const monthly = (0, email_1.escapeHtml)(formatMoney(order.quote.monthly, order.quote.currency));
    if (order.locale === "ar") {
        await (0, email_1.sendEmail)({
            to: order.contact.email,
            replyTo: (0, email_1.replyToAddress)(),
            subject: `استلمنا طلب موقعك ${order.ref} — Xaeon`,
            html: (0, email_1.emailLayout)(`<p>مرحبًا ${first}،</p>
         <p>شكرًا لاختيارك Xaeon لبناء موقع <strong>${biz}</strong>. رقم طلبك <strong dir="ltr">${ref}</strong>.</p>
         <p>التكلفة المبدئية: <span dir="ltr">${setup}</span> مرة واحدة و<span dir="ltr">${monthly}</span> شهريًا.</p>
         <p>سيتواصل معك فريقنا خلال يوم عمل واحد لمراجعة المحتوى والخطوات التالية. أهلًا بك في مجرّتنا ✦</p>
         <p>— فريق Xaeon</p>`, "rtl"),
        });
        return;
    }
    await (0, email_1.sendEmail)({
        to: order.contact.email,
        replyTo: (0, email_1.replyToAddress)(),
        subject: `We received your website order ${order.ref} — Xaeon`,
        html: (0, email_1.emailLayout)(`<p>Hi ${first},</p>
       <p>Thanks for choosing Xaeon to build the <strong>${biz}</strong> website. Your order reference is <strong>${ref}</strong>.</p>
       <p>Estimated price: ${setup} one-time and ${monthly} per month.</p>
       <p>Our team will contact you within one business day to review your content and next steps. Welcome to our galaxy ✦</p>
       <p>— The Xaeon team</p>`),
    });
}
async function sendBuilderPaymentReceived(order) {
    const paid = order.payment.amount ?? order.quote.deposit;
    const currency = order.payment.currency ?? order.quote.currency;
    // Converted charges keep cents (e.g. USD 1,234.56); same-currency deposits are whole numbers.
    const amount = currency === order.quote.currency ? formatMoney(paid, currency) : `${currency} ${paid.toFixed(2)}`;
    const results = await Promise.allSettled([
        (0, email_1.sendEmail)({
            to: (0, bookingEmail_1.notifyEmails)(),
            subject: `Deposit paid: ${order.ref} — ${order.brand.businessName}`,
            html: (0, email_1.emailLayout)(`<p>${(0, email_1.escapeHtml)(amount)} received via ${(0, email_1.escapeHtml)(order.payment.provider ?? "manual")} for order <strong>${(0, email_1.escapeHtml)(order.ref)}</strong>.</p>`),
        }),
        (0, email_1.sendEmail)({
            to: order.contact.email,
            replyTo: (0, email_1.replyToAddress)(),
            subject: order.locale === "ar" ? `تم استلام الدفعة — ${order.ref}` : `Payment received — ${order.ref}`,
            html: order.locale === "ar"
                ? (0, email_1.emailLayout)(`<p>استلمنا دفعتك <span dir="ltr">${(0, email_1.escapeHtml)(amount)}</span> للطلب <strong dir="ltr">${(0, email_1.escapeHtml)(order.ref)}</strong>. بدأنا العمل على موقعك!</p><p>— فريق Xaeon</p>`, "rtl")
                : (0, email_1.emailLayout)(`<p>We received your payment of ${(0, email_1.escapeHtml)(amount)} for order <strong>${(0, email_1.escapeHtml)(order.ref)}</strong>. Work on your website has started!</p><p>— The Xaeon team</p>`),
        }),
    ]);
    for (const r of results)
        if (r.status === "rejected")
            console.error(r.reason);
}
