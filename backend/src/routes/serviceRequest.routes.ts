import express from "express";
import {
  createServiceRequest,
  createServiceRequestEnquiry,
  deleteServiceRequest,
  getMyServiceRequests,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest,
} from "../controllers/serviceRequest.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

/** Public: contact / service-interest (same controller + model as registered requests). */
router.post("/enquiry", createServiceRequestEnquiry);

router.get("/mine", requireAuth, getMyServiceRequests);
router.get("/", requireAuth, requireAdmin, getServiceRequests);
router.get("/:id", requireAuth, requireAdmin, getServiceRequestById);

/** Authenticated: full service request (user + meeting_date). */
router.post("/", requireAuth, createServiceRequest);

router.put("/", requireAuth, requireAdmin, updateServiceRequest);

router.delete("/:id", requireAuth, requireAdmin, deleteServiceRequest);

export default router;
