import type { Request, Response } from "express";
import Package from "../models/package.model";

export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await Package.find().populate("project_type", "title stages");
    res.status(200).json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch packages",
    });
  }
};

export const getPackageById = async (req: Request, res: Response) => {
  try {
    const pkg = await Package.findById(req.params.id).populate(
      "project_type",
      "title stages"
    );
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.status(200).json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch package",
    });
  }
};

export const createPackage = async (req: Request, res: Response) => {
  try {
    const newPackage = await Package.create(req.body.package);
    await newPackage.populate("project_type", "title stages");
    res.status(200).json({
      message: "New Package Created Successfully",
      package: newPackage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create package",
    });
  }
};

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const id = req.body.package?.id;
    if (!id) {
      res.status(400).json({ error: "Package id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.package ?? {};
    const updatedPackage = await Package.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate("project_type", "title stages");
    if (!updatedPackage) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.status(200).json({
      message: "Package Data Updated Successfully",
      package: updatedPackage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update package",
    });
  }
};

export const deletePackage = async (req: Request, res: Response) => {
  try {
    const result = await Package.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.status(200).json({ message: "Package Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete package",
    });
  }
};
