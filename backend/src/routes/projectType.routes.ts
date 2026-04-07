import express from "express";
import {
  createProjectType,
  deleteProjectType,
  getProjectTypeById,
  getProjectTypes,
  updateProjectType,
} from "../controllers/projectType.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

router.get("/", getProjectTypes);
router.get("/:id", getProjectTypeById);

router.post("/", requireAuth, requireAdmin, createProjectType);

router.put("/", requireAuth, requireAdmin, updateProjectType);

router.delete("/:id", requireAuth, requireAdmin, deleteProjectType);

export default router;
