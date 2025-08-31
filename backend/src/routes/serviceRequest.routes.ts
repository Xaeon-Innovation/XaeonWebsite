import express from "express";
import {
  createServiceRequest,
  deleteServiceRequest,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest,
} from "../controllers/serviceRequest.controller";
const router = express.Router();

router.get("/", getServiceRequests);
router.get("/:id", getServiceRequestById);

router.post("/", createServiceRequest);

router.put("/", updateServiceRequest);

router.delete("/:id", deleteServiceRequest);

export default router;
