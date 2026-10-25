import express from "express";
import { getAdminSiteSettings, putAdminSiteSettings } from "../controllers/siteSettings.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { revalidateOnWrite } from "../middleware/revalidateOnWrite";

const router = express.Router();
router.use(revalidateOnWrite);

router.get("/", requireAuth, requireAdmin, getAdminSiteSettings);
router.put("/", requireAuth, requireAdmin, putAdminSiteSettings);

export default router;
