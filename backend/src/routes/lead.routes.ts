import express from "express";
import {
  addLeadNote,
  bulkUpdateLeads,
  convertLead,
  emailLead,
  exportLeadsCsv,
  getLead,
  getLeadStats,
  listLeads,
  updateLead,
} from "../controllers/lead.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/", listLeads);
router.get("/stats", getLeadStats);
router.get("/export.csv", exportLeadsCsv);
router.post("/bulk", bulkUpdateLeads);
router.get("/:id", getLead);
router.patch("/:id", updateLead);
router.post("/:id/notes", addLeadNote);
router.post("/:id/email", emailLead);
router.post("/:id/convert", convertLead);

export default router;
