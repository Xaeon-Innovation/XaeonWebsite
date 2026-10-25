import express from "express";
import {
  createPackage,
  deletePackage,
  getPackageById,
  getPackages,
  updatePackage,
} from "../controllers/package.controller";
import { optionalAuth, requireAuth, requireAdmin } from "../middleware/auth";
import { revalidateOnWrite } from "../middleware/revalidateOnWrite";
const router = express.Router();
router.use(revalidateOnWrite);

router.get("/", optionalAuth, getPackages);
router.get("/:id", optionalAuth, getPackageById);

router.post("/", requireAuth, requireAdmin, createPackage);

router.put("/", requireAuth, requireAdmin, updatePackage);

router.delete("/:id", requireAuth, requireAdmin, deletePackage);

export default router;
