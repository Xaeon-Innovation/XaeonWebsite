import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import multer from "multer";

import { getSiteUploadSubdir, getUploadPublicBase } from "../config/siteUpload.config";
import {
  rasterToWebp,
  assertSvgSafe,
  MAX_SVG_BYTES,
  type RasterKind,
} from "../utils/processSiteImage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.mimetype);
    cb(null, ok);
  },
});

export const uploadSiteAssetMiddleware = upload.single("file");

export const uploadSiteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const kind = String(req.body?.kind ?? "case");
    if (!["team", "case", "logo"].includes(kind)) {
      res.status(400).json({ error: "Invalid kind; use team, case, or logo" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Missing file" });
      return;
    }

    const base = getUploadPublicBase(req);
    if (!base) {
      res.status(500).json({
        error:
          "Set API_PUBLIC_URL in .env (e.g. https://api.xaeons.com) so uploaded files get a stable public URL.",
      });
      return;
    }

    const subdir = getSiteUploadSubdir();
    fs.mkdirSync(subdir, { recursive: true });

    let fileName: string;
    let outBuf: Buffer;

    if (req.file.mimetype === "image/svg+xml") {
      if (kind !== "logo") {
        res.status(400).json({ error: "SVG is only allowed for logo uploads (kind=logo)" });
        return;
      }
      if (req.file.size > MAX_SVG_BYTES) {
        res.status(400).json({ error: "SVG too large (max 200KB)" });
        return;
      }
      const txt = req.file.buffer.toString("utf8");
      assertSvgSafe(txt);
      fileName = `${randomUUID()}.svg`;
      outBuf = req.file.buffer;
    } else {
      fileName = `${randomUUID()}.webp`;
      outBuf = await rasterToWebp(req.file.buffer, kind as RasterKind);
    }

    const diskPath = path.join(subdir, fileName);
    fs.writeFileSync(diskPath, outBuf);

    const url = `${base}/uploads/site/${fileName}`;
    res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Upload failed",
    });
  }
};
