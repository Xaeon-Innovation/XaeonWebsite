import express from "express";
import {
  resendInvite,
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/user.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", getUsers);
router.get("/:id", getUserById);

router.post("/", createUser);
router.post("/:id/invite", resendInvite);

router.put("/", updateUser);

router.delete("/:id", deleteUser);

export default router;
