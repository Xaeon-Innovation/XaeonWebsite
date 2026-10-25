"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEnquiryAutoReply = sendEnquiryAutoReply;
const email_1 = require("./email");
/**
 * Instant "we got your message" reply to someone who used a website form, in the language
 * they used on the site.
 */
async function sendEnquiryAutoReply(details) {
    const first = (0, email_1.escapeHtml)(details.name.trim().split(/\s+/)[0] || details.name);
    const topic = details.topic ? (0, email_1.escapeHtml)(details.topic) : "";
    if (details.locale === "ar") {
        await (0, email_1.sendEmail)({
            to: details.email,
            replyTo: (0, email_1.replyToAddress)(),
            subject: "وصلتنا رسالتك — Xaeon",
            html: (0, email_1.emailLayout)(`<p>مرحبًا ${first}،</p>
         <p>شكرًا لتواصلك مع Xaeon${topic ? ` بخصوص <strong>${topic}</strong>` : ""}. وصلتنا رسالتك وسيرد عليك أحد أعضاء فريقنا خلال يوم عمل واحد.</p>
         <p>إن أردت الحديث أسرع، احجز مكالمة مجانية لمدة 30 دقيقة: <a href="https://xaeons.com/ar/book">xaeons.com/ar/book</a></p>
         <p>— فريق Xaeon</p>`, "rtl"),
        });
        return;
    }
    await (0, email_1.sendEmail)({
        to: details.email,
        replyTo: (0, email_1.replyToAddress)(),
        subject: "We got your message — Xaeon",
        html: (0, email_1.emailLayout)(`<p>Hi ${first},</p>
       <p>Thanks for contacting Xaeon${topic ? ` about <strong>${topic}</strong>` : ""}. We've received your message and someone from our team will reply within one business day.</p>
       <p>If you'd like to talk sooner, book a free 30-minute call: <a href="https://xaeons.com/book">xaeons.com/book</a></p>
       <p>— The Xaeon team</p>`),
    });
}
