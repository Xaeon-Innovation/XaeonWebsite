import express from "express";
const router = express.Router();

import { login, logout, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
