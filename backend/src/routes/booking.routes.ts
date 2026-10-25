import express from "express";
import {
  createBooking,
  disconnectGoogle,
  getAvailability,
  getBookingAdminSettings,
  googleConnectCallback,
  putBookingAdminSettings,
  startGoogleConnect,
} from "../controllers/booking.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { honeypot, publicFormLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.get("/availability", getAvailability);
router.post("/", publicFormLimiter, honeypot, createBooking);

router.get("/settings", requireAuth, requireAdmin, getBookingAdminSettings);
router.put("/settings", requireAuth, requireAdmin, putBookingAdminSettings);
router.get("/google/start", requireAuth, requireAdmin, startGoogleConnect);
router.get("/google/callback", googleConnectCallback);
router.post("/google/disconnect", requireAuth, requireAdmin, disconnectGoogle);

export default router;
