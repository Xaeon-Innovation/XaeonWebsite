import express from "express";
import {
  createPackage,
  deletePackage,
  getPackageById,
  getPackages,
  updatePackage,
} from "../controllers/package.controller";
const router = express.Router();

router.get("/", getPackages);
router.get("/:id", getPackageById);

router.post("/", createPackage);

router.put("/", updatePackage);

router.delete("/:id", deletePackage);

export default router;
