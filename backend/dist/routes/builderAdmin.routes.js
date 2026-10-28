"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const builderAdmin_controller_1 = require("../controllers/builderAdmin.controller");
const auth_1 = require("../middleware/auth");
const revalidateOnWrite_1 = require("../middleware/revalidateOnWrite");
/** Admin Website Builder API (mounted at /api/v1/admin/builder). */
const router = express_1.default.Router();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
function resource(handlers) {
    const r = express_1.default.Router();
    // Catalog + stars appear on the public site, so writes refresh its cache.
    r.use(revalidateOnWrite_1.revalidateOnWrite);
    r.get("/", handlers.list);
    r.post("/", handlers.create);
    r.put("/", handlers.update);
    r.delete("/:id", handlers.remove);
    return r;
}
router.use("/templates", resource(builderAdmin_controller_1.templateCrud));
router.use("/addons", resource(builderAdmin_controller_1.addonCrud));
router.use("/plans", resource(builderAdmin_controller_1.planCrud));
router.use("/stars", resource(builderAdmin_controller_1.starCrud));
router.get("/orders", builderAdmin_controller_1.listOrders);
router.get("/orders/:id", builderAdmin_controller_1.getOrder);
router.patch("/orders/:id", builderAdmin_controller_1.updateOrder);
exports.default = router;
