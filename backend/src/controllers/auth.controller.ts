import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

import User from "../models/user.model";

const COOKIE_NAME = "auth_token";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] =>
  (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

const setAuthCookie = (res: Response, token: string): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      company,
      phone_number,
    } = (req.body ?? {}) as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof phone_number !== "string"
    ) {
      res.status(400).json({ error: "Invalid registration payload" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const role = "user";

    const user = await User.create({
      email: normalizedEmail,
      password: hashed,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      name: `${first_name.trim()} ${last_name.trim()}`.trim(),
      company: typeof company === "string" ? company.trim() : "",
      phone_number: phone_number.trim(),
      role,
    });

    const token = jwt.sign({ userId: String(user._id) }, getJwtSecret() as Secret, {
      expiresIn: getJwtExpiresIn(),
    });
    setAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to register",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Invalid login payload" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: String(user._id) }, getJwtSecret() as Secret, {
      expiresIn: getJwtExpiresIn(),
    });
    setAuthCookie(res, token);

    res.status(200).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to login",
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
  res.status(200).json({ message: "Logged out" });
};

export const me = async (req: Request, res: Response) => {
  // requireAuth middleware attaches req.user
  res.status(200).json({ user: req.user });
};

