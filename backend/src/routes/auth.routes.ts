import express from "express";
const router = express.Router();

import { login, logout, me, register, updateMyProfile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMyProfile);

export default router;
