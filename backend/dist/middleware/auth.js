"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not set");
    return secret;
};
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.auth_token;
        if (!token) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        const user = await user_model_1.default.findById(decoded.userId).select("email name role");
        if (!user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        req.user = {
            id: String(user._id),
            role: user.role,
            email: user.email,
            name: user.name,
        };
        next();
    }
    catch {
        res.status(401).json({ error: "Not authenticated" });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
