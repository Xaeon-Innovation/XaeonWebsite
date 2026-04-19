import express from "express";
import {
  createCaseStudy,
  deleteCaseStudy,
  getCaseStudies,
  updateCaseStudy,
} from "../controllers/caseStudy.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getCaseStudies);
router.post("/", requireAuth, requireAdmin, createCaseStudy);
router.put("/", requireAuth, requireAdmin, updateCaseStudy);
router.delete("/:id", requireAuth, requireAdmin, deleteCaseStudy);

export default router;
