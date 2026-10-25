import type { NextFunction, Request, Response } from "express";
import { notifyContentChanged } from "../services/publishHooks";

/** After any successful create/update/delete on a CMS router, refresh the public site's cache. */
export const revalidateOnWrite = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== "GET") {
    res.on("finish", () => {
      if (res.statusCode < 300) notifyContentChanged();
    });
  }
  next();
};
