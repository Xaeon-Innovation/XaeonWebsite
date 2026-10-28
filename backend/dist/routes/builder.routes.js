"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const builder_controller_1 = require("../controllers/builder.controller");
const rateLimiter_1 = require("../middleware/rateLimiter");
/** Public Website Builder API (mounted at /api/v1/builder). */
const router = express_1.default.Router();
router.get("/catalog", builder_controller_1.getCatalog);
router.post("/assets", rateLimiter_1.builderUploadLimiter, builder_controller_1.builderAssetMiddleware, builder_controller_1.uploadBuilderAsset);
router.post("/orders", rateLimiter_1.publicFormLimiter, rateLimiter_1.honeypot, builder_controller_1.createOrder);
router.get("/orders/:ref/status", builder_controller_1.getOrderStatus);
router.post("/payments/:provider/webhook", builder_controller_1.paymentWebhook);
exports.default = router;
