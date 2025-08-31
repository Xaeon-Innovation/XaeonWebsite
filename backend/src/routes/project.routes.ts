import express from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";
const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.post("/", createProject);

router.put("/", updateProject);

router.delete("/:id", deleteProject);

export default router;
