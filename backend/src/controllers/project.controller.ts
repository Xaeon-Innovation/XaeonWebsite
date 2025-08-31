import { Request, Response } from "express";
import Project from "../models/project.model";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find();
    res.status(200).json({ projects: projects });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params);
    res.status(200).json({ project: project });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
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
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const updatedProject = await Project.updateOne(
      { _id: req.body.project.id },
      req.body.project
    );
    res.status(200).json({
      message: "Project Data Updated Successfully",
      project: updatedProject,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.deleteOne({
      _id: req.params.id,
    });
    res.status(200).json({ message: "Project Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};
