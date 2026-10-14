"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const booking_controller_1 = require("../controllers/booking.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/availability", booking_controller_1.getAvailability);
router.post("/", booking_controller_1.createBooking);
router.get("/settings", auth_1.requireAuth, auth_1.requireAdmin, booking_controller_1.getBookingAdminSettings);
router.put("/settings", auth_1.requireAuth, auth_1.requireAdmin, booking_controller_1.putBookingAdminSettings);
router.get("/google/start", auth_1.requireAuth, auth_1.requireAdmin, booking_controller_1.startGoogleConnect);
router.get("/google/callback", booking_controller_1.googleConnectCallback);
router.post("/google/disconnect", auth_1.requireAuth, auth_1.requireAdmin, booking_controller_1.disconnectGoogle);
exports.default = router;
