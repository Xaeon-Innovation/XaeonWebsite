"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.honeypot = exports.publicFormLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const tooMany = { error: "Too many requests, please try again later." };
/** The test suite logs in many times; limits apply there only when a test opts in. */
const skipInTests = () => process.env.NODE_ENV === "test" && process.env.TEST_RATE_LIMIT !== "1";
/** Login / register brute-force protection. */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooMany,
    skip: skipInTests,
});
/** Public lead forms (enquiry + booking) — stops spam bursts. */
exports.publicFormLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooMany,
    skip: skipInTests,
});
/**
 * Honeypot: public forms render a hidden `website` field that humans never fill.
 * Bots that do get a fake success so they don't retry.
 */
const honeypot = (req, res, next) => {
    const body = (req.body ?? {});
    const nested = body.serviceRequest;
    const trap = body.website ?? nested?.website;
    if (typeof trap === "string" && trap.trim() !== "") {
        res.status(201).json({ message: "Request submitted successfully" });
        return;
    }
    next();
};
exports.honeypot = honeypot;
