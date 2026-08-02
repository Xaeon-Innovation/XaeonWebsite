"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicCaseStudyBySlug = exports.getPublicCaseStudies = exports.getPublicTeamMembers = void 0;
const teamMember_model_1 = __importDefault(require("../models/teamMember.model"));
const caseStudy_model_1 = __importDefault(require("../models/caseStudy.model"));
const siteSettings_model_1 = __importDefault(require("../models/siteSettings.model"));
/** Public: published team members for About page */
const getPublicTeamMembers = async (_req, res) => {
    try {
        const [members, settings] = await Promise.all([
            teamMember_model_1.default.find({ published: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
            siteSettings_model_1.default.findOne({ singletonKey: "default" }).lean(),
        ]);
        res.status(200).json({
            teamMembers: members,
            showSection: settings?.showTeamSection !== false,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch team",
        });
    }
};
exports.getPublicTeamMembers = getPublicTeamMembers;
/** Public: published case studies shaped for CaseSlider */
const getPublicCaseStudies = async (_req, res) => {
    try {
        const rows = await caseStudy_model_1.default.find({ published: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
        const slides = rows.map((doc) => {
            const slug = typeof doc.slug === "string" && doc.slug ? doc.slug : undefined;
            const exploreHref = (typeof doc.exploreHref === "string" && doc.exploreHref.trim()) ||
                (slug ? `/case-studies/${slug}` : undefined);
            return {
                id: String(doc._id),
                slug,
                imageSrc: doc.imageUrl,
                logoSrc: doc.logoUrl || undefined,
                title: doc.title,
                subtitle: doc.subtitle,
                description: doc.description,
                exploreHref,
                exploreLabel: doc.exploreLabel || undefined,
            };
        });
        res.status(200).json({ slides });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch case studies",
        });
    }
};
exports.getPublicCaseStudies = getPublicCaseStudies;
/** Public: single published case study by slug */
const getPublicCaseStudyBySlug = async (req, res) => {
    try {
        const slug = typeof req.params.slug === "string" ? req.params.slug.trim().toLowerCase() : "";
        if (!slug) {
            res.status(400).json({ error: "slug is required" });
            return;
        }
        const caseStudy = await caseStudy_model_1.default.findOne({ slug, published: true }).lean();
        if (!caseStudy) {
            res.status(404).json({ error: "Case study not found" });
            return;
        }
        res.status(200).json({ caseStudy });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch case study",
        });
    }
};
exports.getPublicCaseStudyBySlug = getPublicCaseStudyBySlug;
