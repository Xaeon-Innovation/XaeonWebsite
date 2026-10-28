import express from "express";
import {
  builderAssetMiddleware,
  createOrder,
  getCatalog,
  getOrderStatus,
  paymentWebhook,
  uploadBuilderAsset,
} from "../controllers/builder.controller";
import { builderUploadLimiter, honeypot, publicFormLimiter } from "../middleware/rateLimiter";

/** Public Website Builder API (mounted at /api/v1/builder). */
const router = express.Router();

router.get("/catalog", getCatalog);
router.post("/assets", builderUploadLimiter, builderAssetMiddleware, uploadBuilderAsset);
router.post("/orders", publicFormLimiter, honeypot, createOrder);
router.get("/orders/:ref/status", getOrderStatus);
router.post("/payments/:provider/webhook", paymentWebhook);

export default router;
