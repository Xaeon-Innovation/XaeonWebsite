import express from "express";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonials,
  updateTestimonial,
} from "../controllers/testimonial.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getTestimonials);
router.post("/", requireAuth, requireAdmin, createTestimonial);
router.put("/", requireAuth, requireAdmin, updateTestimonial);
router.delete("/:id", requireAuth, requireAdmin, deleteTestimonial);

export default router;
