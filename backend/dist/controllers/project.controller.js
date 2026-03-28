"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.incrementProjectStatus = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const project_model_1 = __importDefault(require("../models/project.model"));
const getProjects = async (req, res) => {
    try {
        const projects = await project_model_1.default.find();
        res.status(200).json({ projects: projects });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch projects",
        });
    }
};
exports.getProjects = getProjects;
const getProjectById = async (req, res) => {
    try {
        const project = await project_model_1.default.findById(req.params.id);
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        res.status(200).json({ project });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch project",
        });
    }
};
exports.getProjectById = getProjectById;
const createProject = async (req, res) => {
    try {
        const newProject = await project_model_1.default.create(req.body.project);
        res.status(200).json({
            message: "New Project Created Successfully",
            project: newProject,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create project",
        });
    }
};
exports.createProject = createProject;
const incrementProjectStatus = async (req, res) => {
    try {
        const project = await project_model_1.default.findById(req.body.projectId).populate("project_type");
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        const projectType = project.project_type;
        if (!projectType ||
            !Array.isArray(projectType?.stages)) {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to increment project status",
        });
    }
};
exports.incrementProjectStatus = incrementProjectStatus;
const updateProject = async (req, res) => {
    try {
        const id = req.body.project?.id;
        if (!id) {
            res.status(400).json({ error: "Project id is required" });
            return;
        }
        const { id: _id, createdAt, updatedAt, ...update } = req.body.project ?? {};
        const updatedProject = await project_model_1.default.findByIdAndUpdate(id, update, {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update project",
        });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const result = await project_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        res.status(200).json({ message: "Project Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete project",
        });
    }
};
exports.deleteProject = deleteProject;
