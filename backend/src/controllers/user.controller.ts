import type { Request, Response } from "express";
import User from "../models/user.model";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch users",
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
      error: err instanceof Error ? err.message : "Failed to fetch user",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
  } catch (err) {}
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.body.user?.id;
    if (!id) {
      res.status(400).json({ error: "User id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.user;
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
      error: err instanceof Error ? err.message : "Failed to update user",
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
      error: err instanceof Error ? err.message : "Failed to delete user",
    });
  }
};
