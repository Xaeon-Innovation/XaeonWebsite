import express from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "../controllers/employee.controller";
const router = express.Router();

router.get("/", getEmployees);
router.get("/:id", getEmployeeById);

router.post("/", createEmployee);

router.put("/", updateEmployee);

router.delete("/:id", deleteEmployee);

export default router;
