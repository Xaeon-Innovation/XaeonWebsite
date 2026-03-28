"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectType_controller_1 = require("../controllers/projectType.controller");
const router = express_1.default.Router();
router.get("/", projectType_controller_1.getProjectTypes);
router.get("/:id", projectType_controller_1.getProjectTypeById);
router.post("/", projectType_controller_1.createProjectType);
router.put("/", projectType_controller_1.updateProjectType);
router.delete("/:id", projectType_controller_1.deleteProjectType);
exports.default = router;
