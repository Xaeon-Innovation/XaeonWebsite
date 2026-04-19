import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { uploadSiteAsset, uploadSiteAssetMiddleware } from "../controllers/siteUpload.controller";

const router = express.Router();

router.post(
  "/site-asset",
  requireAuth,
  requireAdmin,
  uploadSiteAssetMiddleware,
  uploadSiteAsset
);

export default router;
