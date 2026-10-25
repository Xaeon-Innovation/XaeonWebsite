"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
router.post("/register", rateLimiter_1.authLimiter, auth_controller_1.register);
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
router.post("/set-password", rateLimiter_1.authLimiter, auth_controller_1.setPasswordFromInvite);
router.get("/me", auth_1.requireAuth, auth_controller_1.me);
router.patch("/me", auth_1.requireAuth, auth_controller_1.updateMyProfile);
exports.default = router;
