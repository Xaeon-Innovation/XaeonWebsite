"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicCaseStudies = exports.getPublicTeamMembers = void 0;
const teamMember_model_1 = __importDefault(require("../models/teamMember.model"));
const caseStudy_model_1 = __importDefault(require("../models/caseStudy.model"));
/** Public: published team members for About page */
const getPublicTeamMembers = async (_req, res) => {
    try {
        const members = await teamMember_model_1.default.find({ published: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
        res.status(200).json({ teamMembers: members });
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
        const slides = rows.map((doc) => ({
            id: String(doc._id),
            imageSrc: doc.imageUrl,
            logoSrc: doc.logoUrl || undefined,
            title: doc.title,
            subtitle: doc.subtitle,
            description: doc.description,
            exploreHref: doc.exploreHref || undefined,
            exploreLabel: doc.exploreLabel || undefined,
        }));
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
