import crypto from "crypto";
import bcrypt from "bcryptjs";
import User, { type IUser } from "../models/user.model";
import { emailLayout, escapeHtml, sendEmail } from "./email";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** The admin/client app, where /set-password lives. */
export function appOrigin(): string {
  return (process.env.APP_URL || process.env.FRONTEND_URL || "https://xaeons.com").replace(/\/+$/, "");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Unusable random password for accounts that haven't accepted their invite yet. */
export async function placeholderPasswordHash(): Promise<string> {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
}

/** Issues a fresh invite token (replacing any earlier one) and returns the set-password link. */
export async function issueInvite(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await User.updateOne(
    { _id: userId },
    { $set: { inviteTokenHash: hashToken(token), inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS) } },
  );
  return `${appOrigin()}/set-password?token=${token}`;
}

/** Emails the client their invite link. */
export async function sendInviteEmail(user: Pick<IUser, "email" | "first_name" | "name">, link: string): Promise<void> {
  const first = escapeHtml(user.first_name || user.name || "there");
  await sendEmail({
    to: user.email,
    subject: "Your Xaeon client portal is ready",
    html: emailLayout(`
      <p>Hi ${first},</p>
      <p>We've set up your Xaeon client portal, where you can follow your project's progress and send us requests.</p>
      <p style="margin:24px 0;"><a href="${escapeHtml(link)}" style="background:#72c04f;color:#0b1207;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;display:inline-block;">Set your password</a></p>
      <p style="color:#6b7280;font-size:14px;">This link works once and expires in 7 days. If it expires, reply to this email and we'll send a new one.</p>
    `),
  });
}
