"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const siteContent_controller_1 = require("../controllers/siteContent.controller");
const siteSettings_controller_1 = require("../controllers/siteSettings.controller");
const router = express_1.default.Router();
router.get("/team-members", siteContent_controller_1.getPublicTeamMembers);
router.get("/case-studies/:slug", siteContent_controller_1.getPublicCaseStudyBySlug);
router.get("/case-studies", siteContent_controller_1.getPublicCaseStudies);
router.get("/social-links", siteSettings_controller_1.getPublicSocialLinks);
exports.default = router;
