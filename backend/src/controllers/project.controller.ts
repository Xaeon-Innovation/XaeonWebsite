import type { Request, Response } from "express";
import mongoose from "mongoose";
import "../types/expressAugment";
import Project from "../models/project.model";
import type { IProjectType } from "../models/projectType.model";

const projectListPopulate = [
  { path: "project_type", select: "title stages" },
  { path: "project_manager", select: "name" },
  { path: "user", select: "name email" },
];

export const getProjects = async (req: Request, res: Response) => {
  try {
    const u = req.user;
    if (!u) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const query =
      u.role === "admin"
        ? {}
        : { user: new mongoose.Types.ObjectId(u.id) };

    const projects = await Project.find(query)
      .populate(projectListPopulate)
      .sort({ updatedAt: -1 });

    res.status(200).json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch projects",
    });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const u = req.user;
    if (!u) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const project = await Project.findById(req.params.id).populate(
      projectListPopulate,
    );
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (u.role !== "admin") {
      const rawUser = project.user as unknown;
      const ownerId =
        rawUser &&
        typeof rawUser === "object" &&
        "_id" in rawUser &&
        rawUser._id != null
          ? String((rawUser as { _id: unknown })._id)
          : String(rawUser ?? "");
      if (ownerId !== u.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    res.status(200).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch project",
    });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const newProject = await Project.create(req.body.project);
    res.status(200).json({
      message: "New Project Created Successfully",
      project: newProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create project",
    });
  }
};

export const incrementProjectStatus = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.body.projectId).populate(
      "project_type",
    );

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const projectType = project.project_type as unknown as IProjectType | undefined;
    if (
      !projectType ||
      !Array.isArray(projectType?.stages)
    ) {
      res.status(400).json({
        error: "Project type or stages not found (invalid or missing project_type ref)",
      });
      return;
    }

    if (project.status_count >= projectType.stages.length) {
      res.status(400).json({
        error: "Project already at maximum status level",
      });
      return;
    }

    project.status_count += 1;
    await project.save();

    res.status(200).json({
      message: "Project status incremented successfully",
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to increment project status",
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = req.body.project?.id;
    if (!id) {
      res.status(400).json({ error: "Project id is required" });
      return;
    }
    const { id: _id, createdAt, updatedAt, ...update } = req.body.project ?? {};
    const updatedProject = await Project.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!updatedProject) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(200).json({
      message: "Project Data Updated Successfully",
      project: updatedProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update project",
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const result = await Project.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(200).json({ message: "Project Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete project",
    });
  }
};
