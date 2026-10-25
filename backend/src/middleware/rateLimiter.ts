import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";

const tooMany = { error: "Too many requests, please try again later." };

/** Login / register brute-force protection. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooMany,
});

/** Public lead forms (enquiry + booking) — stops spam bursts. */
export const publicFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: tooMany,
});

/**
 * Honeypot: public forms render a hidden `website` field that humans never fill.
 * Bots that do get a fake success so they don't retry.
 */
export const honeypot = (req: Request, res: Response, next: NextFunction): void => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const nested = body.serviceRequest as Record<string, unknown> | undefined;
  const trap = body.website ?? nested?.website;
  if (typeof trap === "string" && trap.trim() !== "") {
    res.status(201).json({ message: "Request submitted successfully" });
    return;
  }
  next();
};
