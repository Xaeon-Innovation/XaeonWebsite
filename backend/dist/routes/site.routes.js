"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const siteContent_controller_1 = require("../controllers/siteContent.controller");
const router = express_1.default.Router();
router.get("/team-members", siteContent_controller_1.getPublicTeamMembers);
router.get("/case-studies", siteContent_controller_1.getPublicCaseStudies);
exports.default = router;
