"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCaseStudy = exports.updateCaseStudy = exports.createCaseStudy = exports.getCaseStudies = void 0;
const caseStudy_model_1 = __importDefault(require("../models/caseStudy.model"));
const getCaseStudies = async (_req, res) => {
    try {
        const caseStudies = await caseStudy_model_1.default.find().sort({ sortOrder: 1, createdAt: 1 });
        res.status(200).json({ caseStudies });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch case studies",
        });
    }
};
exports.getCaseStudies = getCaseStudies;
const createCaseStudy = async (req, res) => {
    try {
        const p = req.body?.caseStudy;
        if (!p || typeof p.title !== "string" || typeof p.subtitle !== "string" || typeof p.description !== "string") {
            res.status(400).json({ error: "caseStudy requires title, subtitle, description" });
            return;
        }
        if (typeof p.imageUrl !== "string" || !p.imageUrl.trim()) {
            res.status(400).json({ error: "imageUrl is required" });
            return;
        }
        const created = await caseStudy_model_1.default.create({
            title: p.title.trim(),
            subtitle: p.subtitle.trim(),
            description: p.description.trim(),
            imageUrl: p.imageUrl.trim(),
            logoUrl: typeof p.logoUrl === "string" && p.logoUrl.trim() ? p.logoUrl.trim() : undefined,
            exploreHref: typeof p.exploreHref === "string" && p.exploreHref.trim() ? p.exploreHref.trim() : undefined,
            exploreLabel: typeof p.exploreLabel === "string" && p.exploreLabel.trim() ? p.exploreLabel.trim() : undefined,
            sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : 0,
            published: Boolean(p.published),
        });
        res.status(200).json({ message: "Case study created", caseStudy: created });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create case study",
        });
    }
};
exports.createCaseStudy = createCaseStudy;
const updateCaseStudy = async (req, res) => {
    try {
        const body = req.body?.caseStudy;
        const id = body?.id;
        if (!id || typeof id !== "string") {
            res.status(400).json({ error: "caseStudy.id is required" });
            return;
        }
        const patch = {};
        if (typeof body.title === "string")
            patch.title = body.title.trim();
        if (typeof body.subtitle === "string")
            patch.subtitle = body.subtitle.trim();
        if (typeof body.description === "string")
            patch.description = body.description.trim();
        if (typeof body.imageUrl === "string")
            patch.imageUrl = body.imageUrl.trim();
        if (body.logoUrl !== undefined) {
            patch.logoUrl =
                typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : null;
        }
        if (body.exploreHref !== undefined) {
            patch.exploreHref =
                typeof body.exploreHref === "string" && body.exploreHref.trim() ? body.exploreHref.trim() : null;
        }
        if (body.exploreLabel !== undefined) {
            patch.exploreLabel =
                typeof body.exploreLabel === "string" && body.exploreLabel.trim()
                    ? body.exploreLabel.trim()
                    : null;
        }
        if (typeof body.sortOrder === "number")
            patch.sortOrder = body.sortOrder;
        if (typeof body.published === "boolean")
            patch.published = body.published;
        const updated = await caseStudy_model_1.default.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
        if (!updated) {
            res.status(404).json({ error: "Case study not found" });
            return;
        }
        res.status(200).json({ message: "Case study updated", caseStudy: updated });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update case study",
        });
    }
};
exports.updateCaseStudy = updateCaseStudy;
const deleteCaseStudy = async (req, res) => {
    try {
        const result = await caseStudy_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Case study not found" });
            return;
        }
        res.status(200).json({ message: "Case study deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete case study",
        });
    }
};
exports.deleteCaseStudy = deleteCaseStudy;
