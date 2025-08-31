import { Request, Response } from "express";
import User from "../models/user.model";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json({ users: users });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params);
    res.status(200).json({ user: user });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
  } catch (err) {}
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const updatedUser = await User.updateOne(
      { _id: req.body.user.id },
      req.body.user
    );

    res
      .status(200)
      .json({ message: "User Data Updated Successfully", user: updatedUser });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "User Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};
