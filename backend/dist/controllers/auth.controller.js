"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.me = exports.logout = exports.login = exports.register = void 0;
require("../types/expressAugment");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
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
        const { email, password, first_name, last_name, company, phone_number, } = (req.body ?? {});
        if (typeof email !== "string" || email.trim() === "")
            return res.status(400).json({ error: "Valid email is required" });
        if (typeof password !== "string" || password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        if (typeof first_name !== "string" || first_name.trim() === "")
            return res.status(400).json({ error: "First name is required" });
        if (typeof last_name !== "string" || last_name.trim() === "")
            return res.status(400).json({ error: "Last name is required" });
        if (typeof phone_number !== "string" || phone_number.trim() === "")
            return res.status(400).json({ error: "Phone number is required" });
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await user_model_1.default.findOne({ email: normalizedEmail });
        if (existing) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const role = "user";
        const user = await user_model_1.default.create({
            email: normalizedEmail,
            password: hashed,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            name: `${first_name.trim()} ${last_name.trim()}`.trim(),
            company: typeof company === "string" ? company.trim() : "",
            phone_number: phone_number.trim(),
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
        console.error("Register Error:", err);
        if (typeof err === "object" &&
            err !== null &&
            "code" in err &&
            err.code === 11000) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        if (err instanceof mongoose_1.default.Error.ValidationError) {
            const first = Object.values(err.errors)[0];
            res.status(400).json({ error: first?.message ?? "Invalid registration data" });
            return;
        }
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
        console.error("Login Error:", err);
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
    const auth = req.user;
    if (!auth) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    const doc = await user_model_1.default.findById(auth.id).select("-password");
    if (!doc) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    res.status(200).json({
        user: {
            id: String(doc._id),
            email: doc.email,
            name: doc.name,
            role: doc.role,
            first_name: doc.first_name,
            last_name: doc.last_name,
            company: doc.company ?? "",
            phone_number: doc.phone_number,
        },
    });
};
exports.me = me;
/**
 * Authenticated user updates their own profile. Body: `{ user: { ... } }` per API conventions.
 * Optional password change: include `currentPassword` + `newPassword` (min 6 chars).
 */
const updateMyProfile = async (req, res) => {
    try {
        const auth = req.user;
        if (!auth) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const wrap = req.body?.user;
        if (!wrap || typeof wrap !== "object") {
            res.status(400).json({ error: "user payload is required" });
            return;
        }
        const user = await user_model_1.default.findById(auth.id);
        if (!user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const first = typeof wrap.first_name === "string" ? wrap.first_name.trim() : "";
        const last = typeof wrap.last_name === "string" ? wrap.last_name.trim() : "";
        const emailRaw = typeof wrap.email === "string" ? wrap.email.trim() : "";
        const company = typeof wrap.company === "string" ? wrap.company.trim() : "";
        const phone = typeof wrap.phone_number === "string" ? wrap.phone_number.trim() : "";
        if (!first) {
            res.status(400).json({ error: "First name is required" });
            return;
        }
        if (!last) {
            res.status(400).json({ error: "Last name is required" });
            return;
        }
        if (!emailRaw) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        if (!phone) {
            res.status(400).json({ error: "Phone number is required" });
            return;
        }
        const normalizedEmail = emailRaw.toLowerCase();
        if (normalizedEmail !== user.email.toLowerCase()) {
            const taken = await user_model_1.default.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id },
            });
            if (taken) {
                res.status(409).json({ error: "Email already registered" });
                return;
            }
            user.email = normalizedEmail;
        }
        user.first_name = first;
        user.last_name = last;
        user.name = `${first} ${last}`.trim();
        user.company = company;
        user.phone_number = phone;
        const newPw = typeof wrap.newPassword === "string" ? wrap.newPassword : "";
        const currentPw = typeof wrap.currentPassword === "string" ? wrap.currentPassword : "";
        if (newPw !== "") {
            if (newPw.length < 6) {
                res.status(400).json({
                    error: "New password must be at least 6 characters",
                });
                return;
            }
            if (!currentPw) {
                res.status(400).json({
                    error: "Current password is required to set a new password",
                });
                return;
            }
            const ok = await bcryptjs_1.default.compare(currentPw, user.password);
            if (!ok) {
                res.status(403).json({ error: "Current password is incorrect" });
                return;
            }
            user.password = await bcryptjs_1.default.hash(newPw, 12);
        }
        await user.save();
        res.status(200).json({
            user: {
                id: String(user._id),
                email: user.email,
                name: user.name,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                company: user.company ?? "",
                phone_number: user.phone_number,
            },
        });
    }
    catch (err) {
        console.error("updateMyProfile:", err);
        if (typeof err === "object" &&
            err !== null &&
            "code" in err &&
            err.code === 11000) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update profile",
        });
    }
};
exports.updateMyProfile = updateMyProfile;
