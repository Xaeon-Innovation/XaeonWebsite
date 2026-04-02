import type { Request, Response, NextFunction } from "express";
import jwt, { type Secret } from "jsonwebtoken";
import User, { type UserRole } from "../models/user.model";

type JwtPayload = {
  userId: string;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string;
  name: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.auth_token as string | undefined;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret() as Secret) as JwtPayload;
    const user = await User.findById(decoded.userId).select("email name role");
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

