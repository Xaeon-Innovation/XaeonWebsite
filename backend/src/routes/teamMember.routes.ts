import express from "express";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from "../controllers/teamMember.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getTeamMembers);
router.post("/", requireAuth, requireAdmin, createTeamMember);
router.put("/", requireAuth, requireAdmin, updateTeamMember);
router.delete("/:id", requireAuth, requireAdmin, deleteTeamMember);

export default router;
