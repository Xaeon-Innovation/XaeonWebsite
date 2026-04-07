import express from "express";
import {
  createServiceRequest,
  deleteServiceRequest,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest,
} from "../controllers/serviceRequest.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", getServiceRequests);
router.get("/:id", getServiceRequestById);

router.post("/", createServiceRequest);

router.put("/", updateServiceRequest);

router.delete("/:id", deleteServiceRequest);

export default router;
