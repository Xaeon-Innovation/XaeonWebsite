import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

const CAIRO_TZ = "Africa/Cairo";

const formatLogDateTime = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const pad = (s: string) => s.padStart(2, "0");
  const day = pad(get("day"));
  const month = pad(get("month"));
  const year = get("year");
  const hour = pad(get("hour"));
  const minute = pad(get("minute"));
  const second = pad(get("second"));
  return `${day}/${month}/${year}\t${hour}:${minute}:${second}`;
};

const logEvents = async (message: string, logFileName: string): Promise<void> => {
  const dateTime = formatLogDateTime(new Date());
  const logItem = `${dateTime}\t${randomUUID()}\t${message}\n`;
  const logsDir = path.join(__dirname, "..", "..", "logs");
  const logPath = path.join(logsDir, logFileName);

  try {
    await fs.promises.mkdir(logsDir, { recursive: true });
    await fs.promises.appendFile(logPath, logItem);
  } catch (err) {
    console.error(err);
  }
};

export const logger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logEvents(
    `${req.method}\t${req.url}\t${req.headers.origin ?? "unknown"}`,
    "reqLog.log"
  );
  next();
};

export { logEvents };
