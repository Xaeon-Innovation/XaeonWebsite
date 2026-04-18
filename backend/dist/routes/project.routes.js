"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controller_1 = require("../controllers/project.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", auth_1.requireAuth, project_controller_1.getProjects);
router.get("/:id", auth_1.requireAuth, project_controller_1.getProjectById);
router.post("/", auth_1.requireAuth, auth_1.requireAdmin, project_controller_1.createProject);
router.post("/increment-status", auth_1.requireAuth, auth_1.requireAdmin, project_controller_1.incrementProjectStatus);
router.put("/", auth_1.requireAuth, auth_1.requireAdmin, project_controller_1.updateProject);
router.delete("/:id", auth_1.requireAuth, auth_1.requireAdmin, project_controller_1.deleteProject);
exports.default = router;
