"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const package_controller_1 = require("../controllers/package.controller");
const router = express_1.default.Router();
router.get("/", package_controller_1.getPackages);
router.get("/:id", package_controller_1.getPackageById);
router.post("/", package_controller_1.createPackage);
router.put("/", package_controller_1.updatePackage);
router.delete("/:id", package_controller_1.deletePackage);
exports.default = router;
