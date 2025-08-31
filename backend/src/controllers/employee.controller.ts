import { Request, Response } from "express";
import Employee from "../models/employee.model";

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find();
    res.status(200).json({ employees: employees });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params);
    res.status(200).json({ employee: employee });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
  } catch (err) {}
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const updatedEmployee = await Employee.updateOne(
      { _id: req.body.employee.id },
      req.body.employee
    );

    res
      .status(200)
      .json({
        message: "Employee Data Updated Successfully",
        employee: updatedEmployee,
      });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Employee Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
};
