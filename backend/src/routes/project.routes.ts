import express from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  incrementProjectStatus,
  updateProject,
} from "../controllers/project.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.post("/", requireAuth, requireAdmin, createProject);
router.post("/increment-status", requireAuth, requireAdmin, incrementProjectStatus);

router.put("/", requireAuth, requireAdmin, updateProject);

router.delete("/:id", requireAuth, requireAdmin, deleteProject);

export default router;
