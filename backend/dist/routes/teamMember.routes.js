"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teamMember_controller_1 = require("../controllers/teamMember.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", auth_1.requireAuth, auth_1.requireAdmin, teamMember_controller_1.getTeamMembers);
router.post("/", auth_1.requireAuth, auth_1.requireAdmin, teamMember_controller_1.createTeamMember);
router.put("/", auth_1.requireAuth, auth_1.requireAdmin, teamMember_controller_1.updateTeamMember);
router.delete("/:id", auth_1.requireAuth, auth_1.requireAdmin, teamMember_controller_1.deleteTeamMember);
exports.default = router;
