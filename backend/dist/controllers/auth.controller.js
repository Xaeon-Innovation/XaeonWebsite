"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const COOKIE_NAME = "auth_token";
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not set");
    return secret;
};
const getJwtExpiresIn = () => (process.env.JWT_EXPIRES_IN || "7d");
const setAuthCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        path: "/",
    });
};
const register = async (req, res) => {
    try {
        const { email, first_name, last_name, company, phone_number, } = (req.body ?? {});
        if (typeof email !== "string" ||
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            typeof phone_number !== "string") {
            res.status(400).json({ error: "Invalid registration payload" });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await user_model_1.default.findOne({ email: normalizedEmail });
        if (existing) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const phonePassword = phone_number.trim();
        const hashed = await bcryptjs_1.default.hash(phonePassword, 12);
        const role = "user";
        const user = await user_model_1.default.create({
            email: normalizedEmail,
            password: hashed,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            name: `${first_name.trim()} ${last_name.trim()}`.trim(),
            company: typeof company === "string" ? company.trim() : "",
            phone_number: phonePassword,
            role,
        });
        const token = jsonwebtoken_1.default.sign({ userId: String(user._id) }, getJwtSecret(), {
            expiresIn: getJwtExpiresIn(),
        });
        setAuthCookie(res, token);
        res.status(201).json({
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to register",
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = (req.body ?? {});
        if (typeof email !== "string" || typeof password !== "string") {
            res.status(400).json({ error: "Invalid login payload" });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await user_model_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: String(user._id) }, getJwtSecret(), {
            expiresIn: getJwtExpiresIn(),
        });
        setAuthCookie(res, token);
        res.status(200).json({
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to login",
        });
    }
};
exports.login = login;
const logout = async (_req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        path: "/",
    });
    res.status(200).json({ message: "Logged out" });
};
exports.logout = logout;
const me = async (req, res) => {
    // requireAuth middleware attaches req.user
    res.status(200).json({ user: req.user });
};
exports.me = me;
