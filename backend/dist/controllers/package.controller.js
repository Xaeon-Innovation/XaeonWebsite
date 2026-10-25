"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePackage = exports.updatePackage = exports.createPackage = exports.getPackageById = exports.getPackages = void 0;
const package_model_1 = __importDefault(require("../models/package.model"));
const serverError_1 = require("../utils/serverError");
const getPackages = async (req, res) => {
    try {
        // Hidden packages are only listed for admins (the CMS); the public site gets visible ones.
        const filter = req.user?.role === "admin" ? {} : { showOnWebsite: true };
        const packages = await package_model_1.default.find(filter).populate("project_type", "title stages");
        res.status(200).json({ packages });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch packages"),
        });
    }
};
exports.getPackages = getPackages;
const getPackageById = async (req, res) => {
    try {
        const pkg = await package_model_1.default.findById(req.params.id).populate("project_type", "title stages");
        if (!pkg || (!pkg.showOnWebsite && req.user?.role !== "admin")) {
            res.status(404).json({ error: "Package not found" });
            return;
        }
        res.status(200).json({ package: pkg });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch package"),
        });
    }
};
exports.getPackageById = getPackageById;
const createPackage = async (req, res) => {
    try {
        const newPackage = await package_model_1.default.create(req.body.package);
        await newPackage.populate("project_type", "title stages");
        res.status(200).json({
            message: "New Package Created Successfully",
            package: newPackage,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to create package"),
        });
    }
};
exports.createPackage = createPackage;
const updatePackage = async (req, res) => {
    try {
        const id = req.body.package?.id;
        if (!id) {
            res.status(400).json({ error: "Package id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.package ?? {};
        const updatedPackage = await package_model_1.default.findByIdAndUpdate(id, update, {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to update package"),
        });
    }
};
exports.updatePackage = updatePackage;
const deletePackage = async (req, res) => {
    try {
        const result = await package_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Package not found" });
            return;
        }
        res.status(200).json({ message: "Package Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: (0, serverError_1.serverErrorMessage)(err, "Failed to delete package"),
        });
    }
};
exports.deletePackage = deletePackage;
