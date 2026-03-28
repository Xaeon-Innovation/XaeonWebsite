"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceRequest_controller_1 = require("../controllers/serviceRequest.controller");
const router = express_1.default.Router();
router.get("/", serviceRequest_controller_1.getServiceRequests);
router.get("/:id", serviceRequest_controller_1.getServiceRequestById);
router.post("/", serviceRequest_controller_1.createServiceRequest);
router.put("/", serviceRequest_controller_1.updateServiceRequest);
router.delete("/:id", serviceRequest_controller_1.deleteServiceRequest);
exports.default = router;
