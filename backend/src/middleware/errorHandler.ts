import { logEvents } from "./logger";
import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const message = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "Error";

  logEvents(
    `${name}: ${message}\t${req.method}\t${req.url}\t${req.headers.origin ?? "unknown"}`,
    "errLog.log"
  );
  console.error(err instanceof Error ? err.stack : message);

  const status = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({ message });
};
