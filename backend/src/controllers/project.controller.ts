import type { Request, Response } from "express";
import Project from "../models/project.model";
import type { IProjectType } from "../models/projectType.model";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find();
    res.status(200).json({ projects: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch projects",
    });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
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
