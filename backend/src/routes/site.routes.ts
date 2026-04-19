import express from "express";
import { getPublicCaseStudies, getPublicTeamMembers } from "../controllers/siteContent.controller";

const router = express.Router();

router.get("/team-members", getPublicTeamMembers);
router.get("/case-studies", getPublicCaseStudies);

export default router;
