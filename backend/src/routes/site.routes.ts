import express from "express";
import { getPublicCaseStudies, getPublicTeamMembers } from "../controllers/siteContent.controller";
import { getPublicSocialLinks } from "../controllers/siteSettings.controller";

const router = express.Router();

router.get("/team-members", getPublicTeamMembers);
router.get("/case-studies", getPublicCaseStudies);
router.get("/social-links", getPublicSocialLinks);

export default router;
