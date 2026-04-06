"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employee_controller_1 = require("../controllers/employee.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
router.get("/", employee_controller_1.getEmployees);
router.get("/:id", employee_controller_1.getEmployeeById);
router.post("/", employee_controller_1.createEmployee);
router.put("/", employee_controller_1.updateEmployee);
router.delete("/:id", employee_controller_1.deleteEmployee);
exports.default = router;
