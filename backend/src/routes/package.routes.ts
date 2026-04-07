import express from "express";
import {
  createPackage,
  deletePackage,
  getPackageById,
  getPackages,
  updatePackage,
} from "../controllers/package.controller";
import { requireAuth, requireAdmin } from "../middleware/auth";
const router = express.Router();

router.get("/", getPackages);
router.get("/:id", getPackageById);

router.post("/", requireAuth, requireAdmin, createPackage);

router.put("/", requireAuth, requireAdmin, updatePackage);

router.delete("/:id", requireAuth, requireAdmin, deletePackage);

export default router;
