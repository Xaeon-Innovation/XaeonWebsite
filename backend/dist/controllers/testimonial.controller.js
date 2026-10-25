"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.updateTestimonial = exports.createTestimonial = exports.getPublicTestimonials = exports.getTestimonials = void 0;
const testimonial_model_1 = __importDefault(require("../models/testimonial.model"));
const serverError_1 = require("../utils/serverError");
function optStr(value) {
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}
/** Whitelisted fields only (no mass assignment). */
function toFields(body) {
    return {
        ...(typeof body.quote === "string" ? { quote: body.quote.trim() } : {}),
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...("role" in body ? { role: optStr(body.role) ?? "" } : {}),
        ...("company" in body ? { company: optStr(body.company) ?? "" } : {}),
        ...("logoUrl" in body ? { logoUrl: optStr(body.logoUrl) ?? "" } : {}),
        ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
        ...(typeof body.published === "boolean" ? { published: body.published } : {}),
    };
}
const getTestimonials = async (_req, res) => {
    try {
        const testimonials = await testimonial_model_1.default.find().sort({ sortOrder: 1, createdAt: 1 });
        res.status(200).json({ testimonials });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch testimonials") });
    }
};
exports.getTestimonials = getTestimonials;
/** Public: published testimonials for the website. */
const getPublicTestimonials = async (_req, res) => {
    try {
        const testimonials = await testimonial_model_1.default.find({ published: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .select("quote name role company logoUrl")
            .lean();
        res.status(200).json({ testimonials });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch testimonials") });
    }
};
exports.getPublicTestimonials = getPublicTestimonials;
const createTestimonial = async (req, res) => {
    try {
        const body = req.body?.testimonial;
        if (!body || typeof body.quote !== "string" || typeof body.name !== "string") {
            res.status(400).json({ error: "testimonial with quote and name is required" });
            return;
        }
        const testimonial = await testimonial_model_1.default.create(toFields(body));
        res.status(201).json({ message: "Testimonial created", testimonial });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to create testimonial") });
    }
};
exports.createTestimonial = createTestimonial;
const updateTestimonial = async (req, res) => {
    try {
        const body = req.body?.testimonial;
        const id = body?.id;
        if (!body || typeof id !== "string") {
            res.status(400).json({ error: "testimonial.id is required" });
            return;
        }
        const testimonial = await testimonial_model_1.default.findByIdAndUpdate(id, toFields(body), {
            new: true,
            runValidators: true,
        });
        if (!testimonial) {
            res.status(404).json({ error: "Testimonial not found" });
            return;
        }
        res.status(200).json({ message: "Testimonial updated", testimonial });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to update testimonial") });
    }
};
exports.updateTestimonial = updateTestimonial;
const deleteTestimonial = async (req, res) => {
    try {
        const result = await testimonial_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Testimonial not found" });
            return;
        }
        res.status(200).json({ message: "Testimonial deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to delete testimonial") });
    }
};
exports.deleteTestimonial = deleteTestimonial;
