import type { Request, Response } from "express";
import type { Model } from "mongoose";

import BuilderAddon, { ADDON_KINDS } from "../models/builderAddon.model";
import BuilderOrder, { ORDER_STATUSES } from "../models/builderOrder.model";
import BuilderPlan from "../models/builderPlan.model";
import BuilderTemplate from "../models/builderTemplate.model";
import {
  BUILDER_CATEGORIES,
  PLAN_TIERS,
  TEMPLATE_LAYOUTS,
  isOneOf,
  toLocalized,
  toLocalizedList,
  toPrices,
  toStringList,
} from "../models/builderShared";
import Star, { STAR_PRODUCTS } from "../models/star.model";
import { serverErrorMessage } from "../utils/serverError";
import { markOrderPaid, orderToken } from "./builder.controller";

/**
 * Admin CRUD for the Website Builder catalog (templates, add-ons, plans), the galaxy of stars,
 * and builder orders. Request/response shapes match frontend/src/lib/useAdminApi.ts:
 * GET → { [listKey]: [...] }, POST/PUT body { [entityKey]: {...} }, DELETE /:id.
 */

type Fields = Record<string, unknown>;

const optStr = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const has = (body: Fields, key: string) => key in body;

/** Each field mapper only returns keys present in the body (partial updates, no mass assignment). */
function pick(body: Fields, map: Record<string, (v: unknown) => unknown>): Fields {
  const out: Fields = {};
  for (const [key, fn] of Object.entries(map)) {
    if (!has(body, key)) continue;
    const value = fn(body[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const enumOf =
  <T extends string>(list: readonly T[]) =>
  (v: unknown) =>
    isOneOf(list, v) ? v : undefined;
const enumList =
  <T extends string>(list: readonly T[]) =>
  (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is T => isOneOf(list, x)) : undefined;
const slugish = (v: unknown) => optStr(v, 80)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || undefined;

const templateFields = (b: Fields) =>
  pick(b, {
    slug: slugish,
    category: enumOf(BUILDER_CATEGORIES),
    name: toLocalized,
    tagline: toLocalized,
    previewImageUrl: (v) => optStr(v) ?? undefined,
    layout: enumOf(TEMPLATE_LAYOUTS),
    defaultBrand: (v) => {
      if (!v || typeof v !== "object") return undefined;
      const o = v as Fields;
      return { primary: optStr(o.primary, 9) ?? "#72c04f", accent: optStr(o.accent, 9) ?? "#1b3d50", font: optStr(o.font, 40) ?? "modern" };
    },
    pages: toLocalizedList,
    features: toLocalizedList,
    recommendedAddons: (v) => toStringList(v)?.map((k) => k.toLowerCase()),
    minPlan: enumOf(PLAN_TIERS),
    sortOrder: num,
    published: bool,
  });

const addonFields = (b: Fields) =>
  pick(b, {
    key: slugish,
    kind: enumOf(ADDON_KINDS),
    name: toLocalized,
    description: toLocalized,
    icon: (v) => optStr(v, 40),
    prices: toPrices,
    quoted: bool,
    discountPercent: (v) => (typeof v === "number" && v >= 0 && v <= 100 ? v : undefined),
    badge: toLocalized,
    includedIn: enumList(PLAN_TIERS),
    minPlan: (v) => (v === "" || v === null ? null : enumOf(PLAN_TIERS)(v)),
    categories: enumList(BUILDER_CATEGORIES),
    sortOrder: num,
    published: bool,
  });

const planFields = (b: Fields) =>
  pick(b, {
    tier: enumOf(PLAN_TIERS),
    name: toLocalized,
    summary: toLocalized,
    prices: toPrices,
    quoted: bool,
    features: toLocalizedList,
    highlighted: bool,
    sortOrder: num,
    published: bool,
  });

const starFields = (b: Fields) =>
  pick(b, {
    name: (v) => optStr(v, 120),
    logoUrl: (v) => optStr(v) ?? "",
    industry: (v) => optStr(v, 80) ?? "",
    product: enumOf(STAR_PRODUCTS),
    constellation: (v) => optStr(v, 40) ?? "",
    country: (v) => optStr(v, 60) ?? "",
    since: (v) => (typeof v === "number" && v >= 2000 && v <= 2100 ? v : v === null || v === "" ? null : undefined),
    magnitude: (v) => (typeof v === "number" && v >= 1 && v <= 3 ? Math.round(v) : undefined),
    highlight: (v) => optStr(v, 200) ?? "",
    caseStudy: (v) => (typeof v === "string" && /^[a-f0-9]{24}$/i.test(v) ? v : v === "" || v === null ? null : undefined),
    url: (v) => optStr(v) ?? "",
    sortOrder: num,
    published: bool,
  });

function crud(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  listKey: string;
  entityKey: string;
  label: string;
  fields: (b: Fields) => Fields;
  required: string[];
}) {
  const { model, listKey, entityKey, label, fields, required } = opts;
  return {
    list: async (_req: Request, res: Response): Promise<void> => {
      try {
        const items = await model.find().sort({ sortOrder: 1, createdAt: 1 });
        res.status(200).json({ [listKey]: items });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: serverErrorMessage(err, `Failed to fetch ${label}s`) });
      }
    },
    create: async (req: Request, res: Response): Promise<void> => {
      try {
        const body = req.body?.[entityKey] as Fields | undefined;
        const data = body ? fields(body) : {};
        const missing = required.filter((k) => data[k] === undefined);
        if (!body || missing.length) {
          res.status(400).json({ error: `${entityKey} needs: ${missing.join(", ") || required.join(", ")}` });
          return;
        }
        const item = await model.create(data);
        res.status(201).json({ message: `${label} created`, [entityKey]: item });
      } catch (err) {
        console.error(err);
        const dup = (err as { code?: number }).code === 11000;
        res.status(dup ? 409 : 500).json({ error: dup ? `A ${label} with that key already exists` : serverErrorMessage(err, `Failed to create ${label}`) });
      }
    },
    update: async (req: Request, res: Response): Promise<void> => {
      try {
        const body = req.body?.[entityKey] as Fields | undefined;
        if (!body || typeof body.id !== "string") {
          res.status(400).json({ error: `${entityKey}.id is required` });
          return;
        }
        const item = await model.findByIdAndUpdate(body.id, fields(body), { new: true, runValidators: true });
        if (!item) {
          res.status(404).json({ error: `${label} not found` });
          return;
        }
        res.status(200).json({ message: `${label} updated`, [entityKey]: item });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: serverErrorMessage(err, `Failed to update ${label}`) });
      }
    },
    remove: async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await model.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
          res.status(404).json({ error: `${label} not found` });
          return;
        }
        res.status(200).json({ message: `${label} deleted` });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: serverErrorMessage(err, `Failed to delete ${label}`) });
      }
    },
  };
}

export const templateCrud = crud({ model: BuilderTemplate, listKey: "templates", entityKey: "template", label: "Template", fields: templateFields, required: ["slug", "category", "name"] });
export const addonCrud = crud({ model: BuilderAddon, listKey: "addons", entityKey: "addon", label: "Add-on", fields: addonFields, required: ["key", "name"] });
export const planCrud = crud({ model: BuilderPlan, listKey: "plans", entityKey: "plan", label: "Plan", fields: planFields, required: ["tier", "name"] });
export const starCrud = crud({ model: Star, listKey: "stars", entityKey: "star", label: "Star", fields: starFields, required: ["name"] });

/* ───────────── orders ───────────── */

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = String(req.query.status ?? "");
    const filter = isOneOf(ORDER_STATUSES, status) ? { status } : {};
    const orders = await BuilderOrder.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch orders") });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await BuilderOrder.findById(req.params.id).lean();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.status(200).json({ order, statusToken: orderToken(order.ref) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to fetch order") });
  }
};

/** PATCH { status?, note?, markPaid? } — staff workflow on an order. */
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await BuilderOrder.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const body = (req.body ?? {}) as Fields;
    const byName = req.user?.name ?? req.user?.email;
    if (body.markPaid === true) {
      await markOrderPaid(order, { provider: order.payment.provider ?? "manual", event: "staff.mark_paid", byName });
    }
    if (isOneOf(ORDER_STATUSES, body.status) && body.status !== order.status) {
      order.activity.push({ type: "status", message: `Status ${order.status} → ${body.status}`, byName, at: new Date() });
      order.status = body.status;
    }
    const note = optStr(body.note, 2000);
    if (note) order.activity.push({ type: "note", message: note, byName, at: new Date() });
    await order.save();
    res.status(200).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to update order") });
  }
};
