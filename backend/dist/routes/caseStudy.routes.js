"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const caseStudy_controller_1 = require("../controllers/caseStudy.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", auth_1.requireAuth, auth_1.requireAdmin, caseStudy_controller_1.getCaseStudies);
router.post("/", auth_1.requireAuth, auth_1.requireAdmin, caseStudy_controller_1.createCaseStudy);
router.put("/", auth_1.requireAuth, auth_1.requireAdmin, caseStudy_controller_1.updateCaseStudy);
router.delete("/:id", auth_1.requireAuth, auth_1.requireAdmin, caseStudy_controller_1.deleteCaseStudy);
exports.default = router;
