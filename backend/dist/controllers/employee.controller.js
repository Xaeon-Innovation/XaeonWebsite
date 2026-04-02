"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getEmployees = void 0;
const employee_model_1 = __importDefault(require("../models/employee.model"));
const getEmployees = async (req, res) => {
    try {
        const employees = await employee_model_1.default.find();
        res.status(200).json({ employees });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch employees",
        });
    }
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employee_model_1.default.findById(req.params.id);
        if (!employee) {
            res.status(404).json({ error: "Employee not found" });
            return;
        }
        res.status(200).json({ employee });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to fetch employee",
        });
    }
};
exports.getEmployeeById = getEmployeeById;
const createEmployee = async (req, res) => {
    try {
    }
    catch (err) { }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const id = req.body.employee?.id;
        if (!id) {
            res.status(400).json({ error: "Employee id is required" });
            return;
        }
        const { id: _id, ...update } = req.body.employee;
        const updatedEmployee = await employee_model_1.default.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!updatedEmployee) {
            res.status(404).json({ error: "Employee not found" });
            return;
        }
        res.status(200).json({
            message: "Employee Data Updated Successfully",
            employee: updatedEmployee,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to update employee",
        });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const result = await employee_model_1.default.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Employee not found" });
            return;
        }
        res.status(200).json({ message: "Employee Deleted Successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to delete employee",
        });
    }
};
exports.deleteEmployee = deleteEmployee;
