"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrder = exports.getOrder = exports.listOrders = exports.starCrud = exports.planCrud = exports.addonCrud = exports.templateCrud = void 0;
const builderAddon_model_1 = __importStar(require("../models/builderAddon.model"));
const builderOrder_model_1 = __importStar(require("../models/builderOrder.model"));
const builderPlan_model_1 = __importDefault(require("../models/builderPlan.model"));
const builderTemplate_model_1 = __importDefault(require("../models/builderTemplate.model"));
const builderShared_1 = require("../models/builderShared");
const star_model_1 = __importStar(require("../models/star.model"));
const serverError_1 = require("../utils/serverError");
const builder_controller_1 = require("./builder.controller");
const optStr = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const has = (body, key) => key in body;
/** Each field mapper only returns keys present in the body (partial updates, no mass assignment). */
function pick(body, map) {
    const out = {};
    for (const [key, fn] of Object.entries(map)) {
        if (!has(body, key))
            continue;
        const value = fn(body[key]);
        if (value !== undefined)
            out[key] = value;
    }
    return out;
}
const bool = (v) => (typeof v === "boolean" ? v : undefined);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const enumOf = (list) => (v) => (0, builderShared_1.isOneOf)(list, v) ? v : undefined;
const enumList = (list) => (v) => Array.isArray(v) ? v.filter((x) => (0, builderShared_1.isOneOf)(list, x)) : undefined;
const slugish = (v) => optStr(v, 80)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || undefined;
const templateFields = (b) => pick(b, {
    slug: slugish,
    category: enumOf(builderShared_1.BUILDER_CATEGORIES),
    name: builderShared_1.toLocalized,
    tagline: builderShared_1.toLocalized,
    previewImageUrl: (v) => optStr(v) ?? undefined,
    layout: enumOf(builderShared_1.TEMPLATE_LAYOUTS),
    defaultBrand: (v) => {
        if (!v || typeof v !== "object")
            return undefined;
        const o = v;
        return { primary: optStr(o.primary, 9) ?? "#72c04f", accent: optStr(o.accent, 9) ?? "#1b3d50", font: optStr(o.font, 40) ?? "modern" };
    },
    pages: builderShared_1.toLocalizedList,
    features: builderShared_1.toLocalizedList,
    recommendedAddons: (v) => (0, builderShared_1.toStringList)(v)?.map((k) => k.toLowerCase()),
    minPlan: enumOf(builderShared_1.PLAN_TIERS),
    sortOrder: num,
    published: bool,
});
const addonFields = (b) => pick(b, {
    key: slugish,
    kind: enumOf(builderAddon_model_1.ADDON_KINDS),
    name: builderShared_1.toLocalized,
    description: builderShared_1.toLocalized,
    icon: (v) => optStr(v, 40),
    prices: builderShared_1.toPrices,
    quoted: bool,
    discountPercent: (v) => (typeof v === "number" && v >= 0 && v <= 100 ? v : undefined),
    badge: builderShared_1.toLocalized,
    includedIn: enumList(builderShared_1.PLAN_TIERS),
    minPlan: (v) => (v === "" || v === null ? null : enumOf(builderShared_1.PLAN_TIERS)(v)),
    categories: enumList(builderShared_1.BUILDER_CATEGORIES),
    sortOrder: num,
    published: bool,
});
const planFields = (b) => pick(b, {
    tier: enumOf(builderShared_1.PLAN_TIERS),
    name: builderShared_1.toLocalized,
    summary: builderShared_1.toLocalized,
    prices: builderShared_1.toPrices,
    quoted: bool,
    features: builderShared_1.toLocalizedList,
    highlighted: bool,
    sortOrder: num,
    published: bool,
});
const starFields = (b) => pick(b, {
    name: (v) => optStr(v, 120),
    logoUrl: (v) => optStr(v) ?? "",
    industry: (v) => optStr(v, 80) ?? "",
    product: enumOf(star_model_1.STAR_PRODUCTS),
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
function crud(opts) {
    const { model, listKey, entityKey, label, fields, required } = opts;
    return {
        list: async (_req, res) => {
            try {
                const items = await model.find().sort({ sortOrder: 1, createdAt: 1 });
                res.status(200).json({ [listKey]: items });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, `Failed to fetch ${label}s`) });
            }
        },
        create: async (req, res) => {
            try {
                const body = req.body?.[entityKey];
                const data = body ? fields(body) : {};
                const missing = required.filter((k) => data[k] === undefined);
                if (!body || missing.length) {
                    res.status(400).json({ error: `${entityKey} needs: ${missing.join(", ") || required.join(", ")}` });
                    return;
                }
                const item = await model.create(data);
                res.status(201).json({ message: `${label} created`, [entityKey]: item });
            }
            catch (err) {
                console.error(err);
                const dup = err.code === 11000;
                res.status(dup ? 409 : 500).json({ error: dup ? `A ${label} with that key already exists` : (0, serverError_1.serverErrorMessage)(err, `Failed to create ${label}`) });
            }
        },
        update: async (req, res) => {
            try {
                const body = req.body?.[entityKey];
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
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, `Failed to update ${label}`) });
            }
        },
        remove: async (req, res) => {
            try {
                const result = await model.deleteOne({ _id: req.params.id });
                if (result.deletedCount === 0) {
                    res.status(404).json({ error: `${label} not found` });
                    return;
                }
                res.status(200).json({ message: `${label} deleted` });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, `Failed to delete ${label}`) });
            }
        },
    };
}
exports.templateCrud = crud({ model: builderTemplate_model_1.default, listKey: "templates", entityKey: "template", label: "Template", fields: templateFields, required: ["slug", "category", "name"] });
exports.addonCrud = crud({ model: builderAddon_model_1.default, listKey: "addons", entityKey: "addon", label: "Add-on", fields: addonFields, required: ["key", "name"] });
exports.planCrud = crud({ model: builderPlan_model_1.default, listKey: "plans", entityKey: "plan", label: "Plan", fields: planFields, required: ["tier", "name"] });
exports.starCrud = crud({ model: star_model_1.default, listKey: "stars", entityKey: "star", label: "Star", fields: starFields, required: ["name"] });
/* ───────────── orders ───────────── */
const listOrders = async (req, res) => {
    try {
        const status = String(req.query.status ?? "");
        const filter = (0, builderShared_1.isOneOf)(builderOrder_model_1.ORDER_STATUSES, status) ? { status } : {};
        const orders = await builderOrder_model_1.default.find(filter).sort({ createdAt: -1 }).limit(500).lean();
        res.status(200).json({ orders });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch orders") });
    }
};
exports.listOrders = listOrders;
const getOrder = async (req, res) => {
    try {
        const order = await builderOrder_model_1.default.findById(req.params.id).lean();
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.status(200).json({ order, statusToken: (0, builder_controller_1.orderToken)(order.ref) });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to fetch order") });
    }
};
exports.getOrder = getOrder;
/** PATCH { status?, note?, markPaid? } — staff workflow on an order. */
const updateOrder = async (req, res) => {
    try {
        const order = await builderOrder_model_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        const body = (req.body ?? {});
        const byName = req.user?.name ?? req.user?.email;
        if (body.markPaid === true) {
            await (0, builder_controller_1.markOrderPaid)(order, { provider: order.payment.provider ?? "manual", event: "staff.mark_paid", byName });
        }
        if ((0, builderShared_1.isOneOf)(builderOrder_model_1.ORDER_STATUSES, body.status) && body.status !== order.status) {
            order.activity.push({ type: "status", message: `Status ${order.status} → ${body.status}`, byName, at: new Date() });
            order.status = body.status;
        }
        const note = optStr(body.note, 2000);
        if (note)
            order.activity.push({ type: "note", message: note, byName, at: new Date() });
        await order.save();
        res.status(200).json({ order });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to update order") });
    }
};
exports.updateOrder = updateOrder;
