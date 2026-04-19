"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const siteUpload_controller_1 = require("../controllers/siteUpload.controller");
const router = express_1.default.Router();
router.post("/site-asset", auth_1.requireAuth, auth_1.requireAdmin, siteUpload_controller_1.uploadSiteAssetMiddleware, siteUpload_controller_1.uploadSiteAsset);
exports.default = router;
