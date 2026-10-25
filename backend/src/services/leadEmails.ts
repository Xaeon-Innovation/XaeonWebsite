import { emailLayout, escapeHtml, replyToAddress, sendEmail } from "./email";

/**
 * Instant "we got your message" reply to someone who used a website form, in the language
 * they used on the site.
 */
export async function sendEnquiryAutoReply(details: { name: string; email: string; locale?: "en" | "ar"; topic?: string }): Promise<void> {
  const first = escapeHtml(details.name.trim().split(/\s+/)[0] || details.name);
  const topic = details.topic ? escapeHtml(details.topic) : "";
  if (details.locale === "ar") {
    await sendEmail({
      to: details.email,
      replyTo: replyToAddress(),
      subject: "وصلتنا رسالتك — Xaeon",
      html: emailLayout(
        `<p>مرحبًا ${first}،</p>
         <p>شكرًا لتواصلك مع Xaeon${topic ? ` بخصوص <strong>${topic}</strong>` : ""}. وصلتنا رسالتك وسيرد عليك أحد أعضاء فريقنا خلال يوم عمل واحد.</p>
         <p>إن أردت الحديث أسرع، احجز مكالمة مجانية لمدة 30 دقيقة: <a href="https://xaeons.com/ar/book">xaeons.com/ar/book</a></p>
         <p>— فريق Xaeon</p>`,
        "rtl",
      ),
    });
    return;
  }
  await sendEmail({
    to: details.email,
    replyTo: replyToAddress(),
    subject: "We got your message — Xaeon",
    html: emailLayout(
      `<p>Hi ${first},</p>
       <p>Thanks for contacting Xaeon${topic ? ` about <strong>${topic}</strong>` : ""}. We've received your message and someone from our team will reply within one business day.</p>
       <p>If you'd like to talk sooner, book a free 30-minute call: <a href="https://xaeons.com/book">xaeons.com/book</a></p>
       <p>— The Xaeon team</p>`,
    ),
  });
}
