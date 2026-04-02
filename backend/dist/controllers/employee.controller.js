"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getEmployees = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const employee_model_1 = __importDefault(require("../models/employee.model"));
const EMPLOYEE_ROLES = new Set([
    "Backend Developer",
    "Frontend Developer",
    "Full-Stack Developer",
    "Graphic Designer",
    "Project Manager",
    "Sales",
    "Admin",
]);
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
        const { email, first_name, last_name, department, phone_number, role, } = (req.body?.employee ?? req.body ?? {});
        if (typeof email !== "string" ||
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            typeof phone_number !== "string" ||
            typeof role !== "string" ||
            !EMPLOYEE_ROLES.has(role)) {
            res.status(400).json({ error: "Invalid employee payload" });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmployee = await employee_model_1.default.findOne({ email: normalizedEmail });
        if (existingEmployee) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }
        const phonePassword = phone_number.trim();
        const hashedPassword = await bcryptjs_1.default.hash(phonePassword, 12);
        const employee = await employee_model_1.default.create({
            email: normalizedEmail,
            password: hashedPassword,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            name: `${first_name.trim()} ${last_name.trim()}`.trim(),
            department: typeof department === "string" ? department.trim() : "",
            phone_number: phonePassword,
            role,
        });
        res.status(201).json({
            message: "Employee Created Successfully",
            employee: {
                id: String(employee._id),
                email: employee.email,
                first_name: employee.first_name,
                last_name: employee.last_name,
                name: employee.name,
                department: employee.department,
                phone_number: employee.phone_number,
                role: employee.role,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to create employee",
        });
    }
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
