import type { Request, Response } from "express";
import User from "../models/user.model";
import { issueInvite, placeholderPasswordHash, sendInviteEmail } from "../services/invite";
import { serverErrorMessage } from "../utils/serverError";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to fetch users"),
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to fetch user"),
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      first_name,
      last_name,
      company,
      phone_number,
      role,
    } = (req.body?.user ?? req.body ?? {}) as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof phone_number !== "string"
    ) {
      res.status(400).json({ error: "Invalid user payload" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const phone = phone_number.trim();
    // No guessable default password: the person sets their own from an emailed invite link.
    const hashedPassword = await placeholderPasswordHash();
    const safeRole = role === "admin" ? "admin" : "user";

    const user = await User.create({
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
      const link = await issueInvite(String(user._id));
      await sendInviteEmail(user, link);
      inviteSent = true;
    } catch (inviteErr) {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to create user"),
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.body.user?.id;
    if (!id) {
      res.status(400).json({ error: "User id is required" });
      return;
    }
    const { id: _id, password: _password, ...update } = req.body.user;
    const updatedUser = await User.findByIdAndUpdate(id, update, {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to update user"),
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json({ message: "User Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: serverErrorMessage(err, "Failed to delete user"),
    });
  }
};

/** Admin: email a fresh set-password link (expires in 7 days). */
export const resendInvite = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const link = await issueInvite(String(user._id));
    await sendInviteEmail(user, link);
    res.status(200).json({ message: `Invite sent to ${user.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to send invite") });
  }
};
