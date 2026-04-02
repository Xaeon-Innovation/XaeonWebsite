"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getUsers = async (req, res) => {
    try {
        const users = await user_model_1.default.find();
        res.status(200).json({ users });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch users",
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch user",
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { email, first_name, last_name, company, phone_number, role, } = (req.body?.user ?? req.body ?? {});
        if (typeof email !== "string" ||
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            typeof phone_number !== "string") {
            res.status(400).json({ error: "Invalid user payload" });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await user_model_1.default.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const phonePassword = phone_number.trim();
        const hashedPassword = await bcryptjs_1.default.hash(phonePassword, 12);
        const safeRole = role === "admin" ? "admin" : "user";
        const user = await user_model_1.default.create({
            email: normalizedEmail,
            password: hashedPassword,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            name: `${first_name.trim()} ${last_name.trim()}`.trim(),
            company: typeof company === "string" ? company.trim() : "",
            phone_number: phonePassword,
            role: safeRole,
        });
        res.status(201).json({
            message: "User Created Successfully",
            user: {
                id: String(user._id),
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                name: user.name,
                company: user.company,
                phone_number: user.phone_number,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create user",
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const id = req.body.user?.id;
        if (!id) {
            res.status(400).json({ error: "User id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.user;
        const updatedUser = await user_model_1.default.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({
            message: "User Data Updated Successfully",
            user: updatedUser,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update user",
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const result = await user_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ message: "User Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete user",
        });
    }
};
exports.deleteUser = deleteUser;
