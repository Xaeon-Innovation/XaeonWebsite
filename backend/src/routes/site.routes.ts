import express from "express";
import {
  getPublicCaseStudies,
  getPublicCaseStudyBySlug,
  getPublicTeamMembers,
} from "../controllers/siteContent.controller";
import { getPublicSocialLinks } from "../controllers/siteSettings.controller";
import { getPublicTestimonials } from "../controllers/testimonial.controller";

const router = express.Router();

router.get("/team-members", getPublicTeamMembers);
router.get("/case-studies/:slug", getPublicCaseStudyBySlug);
router.get("/case-studies", getPublicCaseStudies);
router.get("/social-links", getPublicSocialLinks);
router.get("/testimonials", getPublicTestimonials);

export default router;
