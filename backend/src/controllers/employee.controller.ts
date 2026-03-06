import type { Request, Response } from "express";
import Employee from "../models/employee.model";

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
  } catch (err) {}
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
