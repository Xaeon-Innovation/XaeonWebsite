import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Employee from "../models/employee.model";

const EMPLOYEE_ROLES = new Set([
  "Backend Developer",
  "Frontend Developer",
  "Full-Stack Developer",
  "Graphic Designer",
  "Project Manager",
  "Sales",
  "Admin",
]);

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find();
    res.status(200).json({ employees });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch employees",
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.status(200).json({ employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch employee",
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      email,
      first_name,
      last_name,
      department,
      phone_number,
      role,
    } = (req.body?.employee ?? req.body ?? {}) as Record<string, unknown>;

    if (
      typeof email !== "string" ||
      typeof first_name !== "string" ||
      typeof last_name !== "string" ||
      typeof phone_number !== "string" ||
      typeof role !== "string" ||
      !EMPLOYEE_ROLES.has(role)
    ) {
      res.status(400).json({ error: "Invalid employee payload" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmployee = await Employee.findOne({ email: normalizedEmail });
    if (existingEmployee) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const phonePassword = phone_number.trim();
    const hashedPassword = await bcrypt.hash(phonePassword, 12);

    const employee = await Employee.create({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create employee",
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const id = req.body.employee?.id;
    if (!id) {
      res.status(400).json({ error: "Employee id is required" });
      return;
    }
    const { id: _id, ...update } = req.body.employee;
    const updatedEmployee = await Employee.findByIdAndUpdate(id, update, {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update employee",
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const result = await Employee.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.status(200).json({ message: "Employee Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete employee",
    });
  }
};
