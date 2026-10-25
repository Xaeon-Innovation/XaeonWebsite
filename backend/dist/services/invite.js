"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appOrigin = appOrigin;
exports.hashToken = hashToken;
exports.placeholderPasswordHash = placeholderPasswordHash;
exports.issueInvite = issueInvite;
exports.sendInviteEmail = sendInviteEmail;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_1 = require("./email");
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** The admin/client app, where /set-password lives. */
function appOrigin() {
    return (process.env.APP_URL || process.env.FRONTEND_URL || "https://xaeons.com").replace(/\/+$/, "");
}
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
/** Unusable random password for accounts that haven't accepted their invite yet. */
async function placeholderPasswordHash() {
    return bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString("hex"), 12);
}
/** Issues a fresh invite token (replacing any earlier one) and returns the set-password link. */
async function issueInvite(userId) {
    const token = crypto_1.default.randomBytes(32).toString("base64url");
    await user_model_1.default.updateOne({ _id: userId }, { $set: { inviteTokenHash: hashToken(token), inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS) } });
    return `${appOrigin()}/set-password?token=${token}`;
}
/** Emails the client their invite link. */
async function sendInviteEmail(user, link) {
    const first = (0, email_1.escapeHtml)(user.first_name || user.name || "there");
    await (0, email_1.sendEmail)({
        to: user.email,
        subject: "Your Xaeon client portal is ready",
        html: (0, email_1.emailLayout)(`
      <p>Hi ${first},</p>
      <p>We've set up your Xaeon client portal, where you can follow your project's progress and send us requests.</p>
      <p style="margin:24px 0;"><a href="${(0, email_1.escapeHtml)(link)}" style="background:#72c04f;color:#0b1207;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block;">Set your password</a></p>
      <p style="color:#6b7280;font-size:14px;">This link works once and expires in 7 days. If it expires, reply to this email and we'll send a new one.</p>
    `),
    });
}
