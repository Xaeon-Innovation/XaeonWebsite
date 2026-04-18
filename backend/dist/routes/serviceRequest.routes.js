"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceRequest_controller_1 = require("../controllers/serviceRequest.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/** Public: contact / service-interest (same controller + model as registered requests). */
router.post("/enquiry", serviceRequest_controller_1.createServiceRequestEnquiry);
router.get("/mine", auth_1.requireAuth, serviceRequest_controller_1.getMyServiceRequests);
router.get("/", auth_1.requireAuth, auth_1.requireAdmin, serviceRequest_controller_1.getServiceRequests);
router.get("/:id", auth_1.requireAuth, auth_1.requireAdmin, serviceRequest_controller_1.getServiceRequestById);
/** Authenticated: full service request (user + meeting_date). */
router.post("/", auth_1.requireAuth, serviceRequest_controller_1.createServiceRequest);
router.put("/", auth_1.requireAuth, auth_1.requireAdmin, serviceRequest_controller_1.updateServiceRequest);
router.delete("/:id", auth_1.requireAuth, auth_1.requireAdmin, serviceRequest_controller_1.deleteServiceRequest);
exports.default = router;
