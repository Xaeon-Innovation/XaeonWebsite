"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStars = void 0;
const star_model_1 = __importDefault(require("../models/star.model"));
const serverError_1 = require("../utils/serverError");
/** Public: published clients for the website's galaxy of stars (admin CRUD lives in builderAdmin.controller.ts). */
const getPublicStars = async (_req, res) => {
    try {
        const stars = await star_model_1.default.find({ published: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .select("name logoUrl industry product constellation country since magnitude highlight caseStudy url")
            .populate({ path: "caseStudy", select: "slug title -_id", match: { published: true } })
            .lean();
        res.status(200).json({ stars });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch stars") });
    }
};
exports.getPublicStars = getPublicStars;
