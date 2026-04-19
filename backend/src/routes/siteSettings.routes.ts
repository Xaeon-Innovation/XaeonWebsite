import express from "express";
import { getAdminSiteSettings, putAdminSiteSettings } from "../controllers/siteSettings.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getAdminSiteSettings);
router.put("/", requireAuth, requireAdmin, putAdminSiteSettings);

export default router;
