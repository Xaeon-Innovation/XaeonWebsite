"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendInvite = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const invite_1 = require("../services/invite");
const serverError_1 = require("../utils/serverError");
const getUsers = async (req, res) => {
    try {
        const users = await user_model_1.default.find();
        res.status(200).json({ users });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch users"),
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
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch user"),
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
        const phone = phone_number.trim();
        // No guessable default password: the person sets their own from an emailed invite link.
        const hashedPassword = await (0, invite_1.placeholderPasswordHash)();
        const safeRole = role === "admin" ? "admin" : "user";
        const user = await user_model_1.default.create({
            email: normalizedEmail,
            password: hashedPassword,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            name: `${first_name.trim()} ${last_name.trim()}`.trim(),
            company: typeof company === "string" ? company.trim() : "",
            phone_number: phone,
            role: safeRole,
        });
        let inviteSent = false;
        try {
            const link = await (0, invite_1.issueInvite)(String(user._id));
            await (0, invite_1.sendInviteEmail)(user, link);
            inviteSent = true;
        }
        catch (inviteErr) {
            console.error("Invite email failed:", inviteErr);
        }
        res.status(201).json({
            message: inviteSent
                ? "User created. We emailed them a link to set their password."
                : "User created, but the invite email could not be sent. Use \"Resend invite\" to try again.",
            inviteSent,
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
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to create user"),
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
        const { id: _id, password: _password, ...update } = req.body.user;
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
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to update user"),
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
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to delete user"),
        });
    }
};
exports.deleteUser = deleteUser;
/** Admin: email a fresh set-password link (expires in 7 days). */
const resendInvite = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const link = await (0, invite_1.issueInvite)(String(user._id));
        await (0, invite_1.sendInviteEmail)(user, link);
        res.status(200).json({ message: `Invite sent to ${user.email}` });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to send invite") });
    }
};
exports.resendInvite = resendInvite;
