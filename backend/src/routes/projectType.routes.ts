import express from "express";
import {
  createProjectType,
  deleteProjectType,
  getProjectTypeById,
  getProjectTypes,
  updateProjectType,
} from "../controllers/projectType.controller";
const router = express.Router();

router.get("/", getProjectTypes);
router.get("/:id", getProjectTypeById);

router.post("/", createProjectType);

router.put("/", updateProjectType);

router.delete("/:id", deleteProjectType);

export default router;
