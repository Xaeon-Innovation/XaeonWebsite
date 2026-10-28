import express, { type Router } from "express";
import {
  addonCrud,
  getOrder,
  listOrders,
  planCrud,
  starCrud,
  templateCrud,
  updateOrder,
} from "../controllers/builderAdmin.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { revalidateOnWrite } from "../middleware/revalidateOnWrite";

/** Admin Website Builder API (mounted at /api/v1/admin/builder). */
const router = express.Router();
router.use(requireAuth, requireAdmin);

function resource(handlers: typeof templateCrud): Router {
  const r = express.Router();
  // Catalog + stars appear on the public site, so writes refresh its cache.
  r.use(revalidateOnWrite);
  r.get("/", handlers.list);
  r.post("/", handlers.create);
  r.put("/", handlers.update);
  r.delete("/:id", handlers.remove);
  return r;
}

router.use("/templates", resource(templateCrud));
router.use("/addons", resource(addonCrud));
router.use("/plans", resource(planCrud));
router.use("/stars", resource(starCrud));

router.get("/orders", listOrders);
router.get("/orders/:id", getOrder);
router.patch("/orders/:id", updateOrder);

export default router;
