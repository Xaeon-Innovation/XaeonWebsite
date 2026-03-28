"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectType = exports.updateProjectType = exports.createProjectType = exports.getProjectTypeById = exports.getProjectTypes = void 0;
const projectType_model_1 = __importDefault(require("../models/projectType.model"));
const getProjectTypes = async (req, res) => {
    try {
        const projectTypes = await projectType_model_1.default.find();
        res.status(200).json({ projectTypes });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch project types",
        });
    }
};
exports.getProjectTypes = getProjectTypes;
const getProjectTypeById = async (req, res) => {
    try {
        const projectType = await projectType_model_1.default.findById(req.params.id);
        if (!projectType) {
            res.status(404).json({ error: "Project type not found" });
            return;
        }
        res.status(200).json({ projectType });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch project type",
        });
    }
};
exports.getProjectTypeById = getProjectTypeById;
const createProjectType = async (req, res) => {
    try {
        const newProjectType = await projectType_model_1.default.create(req.body.projectType);
        res.status(200).json({
            message: "New Project Type Created Successfully",
            projectType: newProjectType,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create project type",
        });
    }
};
exports.createProjectType = createProjectType;
const updateProjectType = async (req, res) => {
    try {
        const id = req.body.projectType?.id;
        if (!id) {
            res.status(400).json({ error: "Project type id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.projectType ?? {};
        const updatedProjectType = await projectType_model_1.default.findByIdAndUpdate(id, update, {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update project type",
        });
    }
};
exports.updateProjectType = updateProjectType;
const deleteProjectType = async (req, res) => {
    try {
        const result = await projectType_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Project type not found" });
            return;
        }
        res.status(200).json({ message: "Project Type Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete project type",
        });
    }
};
exports.deleteProjectType = deleteProjectType;
