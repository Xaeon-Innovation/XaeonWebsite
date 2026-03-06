import type { Request, Response } from "express";
import ProjectType from "../models/projectType.model";

export const getProjectTypes = async (req: Request, res: Response) => {
  try {
    const projectTypes = await ProjectType.find();
    res.status(200).json({ projectTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch project types",
    });
  }
};

export const getProjectTypeById = async (req: Request, res: Response) => {
  try {
    const projectType = await ProjectType.findById(req.params.id);
    if (!projectType) {
      res.status(404).json({ error: "Project type not found" });
      return;
    }
    res.status(200).json({ projectType });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch project type",
    });
  }
};

export const createProjectType = async (req: Request, res: Response) => {
  try {
    const newProjectType = await ProjectType.create(req.body.projectType);
    res.status(200).json({
      message: "New Project Type Created Successfully",
      projectType: newProjectType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create project type",
    });
  }
};

export const updateProjectType = async (req: Request, res: Response) => {
  try {
    const id = req.body.projectType?.id;
    if (!id) {
      res.status(400).json({ error: "Project type id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.projectType ?? {};
    const updatedProjectType = await ProjectType.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updatedProjectType) {
      res.status(404).json({ error: "Project type not found" });
      return;
    }
    res.status(200).json({
      message: "Project Type Data Updated Successfully",
      projectType: updatedProjectType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update project type",
    });
  }
};

export const deleteProjectType = async (req: Request, res: Response) => {
  try {
    const result = await ProjectType.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Project type not found" });
      return;
    }
    res.status(200).json({ message: "Project Type Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete project type",
    });
  }
};
