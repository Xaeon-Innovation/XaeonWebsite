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
exports.paymentWebhook = exports.getOrderStatus = exports.createOrder = exports.uploadBuilderAsset = exports.builderAssetMiddleware = exports.getCatalog = void 0;
exports.newOrderRef = newOrderRef;
exports.orderToken = orderToken;
exports.markOrderPaid = markOrderPaid;
const crypto_1 = __importStar(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const siteUpload_config_1 = require("../config/siteUpload.config");
const builderAddon_model_1 = __importDefault(require("../models/builderAddon.model"));
const builderOrder_model_1 = __importDefault(require("../models/builderOrder.model"));
const builderPlan_model_1 = __importDefault(require("../models/builderPlan.model"));
const builderTemplate_model_1 = __importDefault(require("../models/builderTemplate.model"));
const builderShared_1 = require("../models/builderShared");
const serviceRequest_model_1 = __importDefault(require("../models/serviceRequest.model"));
const builderEmails_1 = require("../services/builderEmails");
const payments_1 = require("../services/payments");
const fx_1 = require("../services/payments/fx");
const storage_1 = require("../services/storage");
const attribution_1 = require("../utils/attribution");
const builderQuote_1 = require("../utils/builderQuote");
const processSiteImage_1 = require("../utils/processSiteImage");
const serverError_1 = require("../utils/serverError");
/** Public Website Builder API. Admin side: builderAdmin.controller.ts. */
const siteOrigin = () => (process.env.SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");
const apiOrigin = () => (process.env.API_PUBLIC_URL || "https://api.xaeons.com").replace(/\/+$/, "");
/* ───────────── catalog ───────────── */
const PUBLIC_TEMPLATE_FIELDS = "slug category name tagline previewImageUrl layout hero mode corners defaultBrand pageKeys defaultPages tags goals features recommendedAddons minPlan";
const PUBLIC_ADDON_FIELDS = "key kind name description icon prices quoted discountPercent badge includedIn minPlan categories";
const PUBLIC_PLAN_FIELDS = "tier name summary prices includedPages extraPagePrice quoted features highlighted";
const getCatalog = async (_req, res) => {
    try {
        const sort = { sortOrder: 1, createdAt: 1 };
        const [templates, addons, plans] = await Promise.all([
            builderTemplate_model_1.default.find({ published: true }).sort(sort).select(PUBLIC_TEMPLATE_FIELDS).lean(),
            builderAddon_model_1.default.find({ published: true }).sort(sort).select(PUBLIC_ADDON_FIELDS).lean(),
            builderPlan_model_1.default.find({ published: true }).sort(sort).select(PUBLIC_PLAN_FIELDS).lean(),
        ]);
        // Payment options per market, so the wizard can show them once the customer picks a country.
        const payments = Object.fromEntries(await Promise.all(builderShared_1.MARKETS.map(async (m) => [m, await (0, payments_1.paymentOptions)(m)])));
        res.status(200).json({ templates, addons, plans, payments });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to load the builder catalog") });
    }
};
exports.getCatalog = getCatalog;
async function quoteCatalog() {
    const [plans, addons] = await Promise.all([builderPlan_model_1.default.find({ published: true }).lean(), builderAddon_model_1.default.find({ published: true }).lean()]);
    return {
        plans: plans.map((p) => ({
            tier: p.tier,
            name: p.name.en,
            prices: p.prices,
            quoted: p.quoted,
            includedPages: p.includedPages ?? 5,
            extraPagePrice: { EGP: p.extraPagePrice?.EGP ?? 0, AED: p.extraPagePrice?.AED ?? 0, USD: p.extraPagePrice?.USD ?? 0 },
        })),
        addons: addons.map((a) => ({
            key: a.key,
            name: a.name.en,
            prices: a.prices,
            quoted: a.quoted,
            discountPercent: a.discountPercent,
            includedIn: a.includedIn,
            minPlan: a.minPlan,
        })),
    };
}
/* ───────────── brand asset upload ───────────── */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        cb(null, ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.mimetype));
    },
});
exports.builderAssetMiddleware = upload.single("file");
/** Customer logo / brand images. Always re-encoded to WebP (SVG is rasterised: stored SVG can carry script). */
const uploadBuilderAsset = async (req, res) => {
    try {
        const type = req.body?.type === "logo" ? "logo" : "asset";
        if (!req.file) {
            res.status(400).json({ error: "Missing file (jpeg, png, webp or svg)" });
            return;
        }
        if (req.file.mimetype === "image/svg+xml" && req.file.size > processSiteImage_1.MAX_SVG_BYTES) {
            res.status(400).json({ error: "SVG too large (max 200KB)" });
            return;
        }
        const base = (0, siteUpload_config_1.getUploadPublicBase)(req);
        if (!base) {
            res.status(500).json({ error: "Uploads are not configured" });
            return;
        }
        const outBuf = await (0, processSiteImage_1.rasterToWebp)(req.file.buffer, type === "logo" ? "logo" : "blog");
        const url = await (0, storage_1.putObject)(`builder/${(0, crypto_1.randomUUID)()}.webp`, outBuf, "image/webp", base);
        res.status(200).json({ url });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ error: "That image could not be processed. Try a JPG or PNG under 10MB." });
    }
};
exports.uploadBuilderAsset = uploadBuilderAsset;
/** Only URLs we issued from the upload endpoint above are accepted on orders. */
function isBuilderAssetUrl(url) {
    if (typeof url !== "string" || url.length > 500)
        return false;
    const prefixes = [`${apiOrigin()}/uploads/builder/`];
    const s3 = process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, "");
    if (s3)
        prefixes.push(`${s3}/builder/`);
    return prefixes.some((p) => url.startsWith(p)) && /^[\w:/.-]+$/.test(url);
}
/* ───────────── orders ───────────── */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newOrderRef() {
    const bytes = crypto_1.default.randomBytes(6);
    return `XB-${[...bytes].map((b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`;
}
/** Lets the success page read an order's status without logging in; only the customer has the link. */
function orderToken(ref) {
    return crypto_1.default.createHmac("sha256", process.env.JWT_SECRET ?? "").update(`builder-order:${ref}`).digest("hex").slice(0, 32);
}
function successUrl(order) {
    const prefix = order.locale === "ar" ? "/ar" : "";
    return `${siteOrigin()}${prefix}/website-builder/success?ref=${encodeURIComponent(order.ref)}&token=${orderToken(order.ref)}`;
}
const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const HEX = /^#[0-9a-f]{6}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createOrder = async (req, res) => {
    try {
        const body = req.body?.order;
        if (!body || typeof body !== "object") {
            res.status(400).json({ error: "order payload is required" });
            return;
        }
        const config = (body.config ?? {});
        const brand = (body.brand ?? {});
        const contact = (body.contact ?? {});
        // The country decides the currency; a `market` sent by the browser is ignored.
        const country = typeof body.country === "string" && (0, builderShared_1.isCountry)(body.country.toUpperCase()) ? body.country.toUpperCase() : undefined;
        const market = (0, builderShared_1.marketFor)(country ?? "EG");
        // "Send without paying" on the proposal step: save the order, the team follows up.
        const payNow = body.payNow !== false;
        const locale = body.locale === "ar" ? "ar" : "en";
        const category = config.category;
        const planTier = config.planTier;
        const billing = config.billing === "annual" ? "annual" : "monthly";
        const addonKeys = Array.isArray(config.addonKeys) ? config.addonKeys.filter((k) => typeof k === "string").slice(0, 30) : [];
        const name = str(contact.name, 120);
        const email = str(contact.email, 200).toLowerCase();
        const phone = str(contact.phone, 40);
        const businessName = str(brand.businessName, 120);
        const errors = [];
        if (!country)
            errors.push("country");
        if (!(0, builderShared_1.isOneOf)(builderShared_1.BUILDER_CATEGORIES, category))
            errors.push("config.category");
        if (!(0, builderShared_1.isOneOf)(builderShared_1.PLAN_TIERS, planTier))
            errors.push("config.planTier");
        if (!name)
            errors.push("contact.name");
        if (!EMAIL.test(email))
            errors.push("contact.email");
        if (phone.replace(/\D/g, "").length < 7)
            errors.push("contact.phone");
        if (!businessName)
            errors.push("brand.businessName");
        if (errors.length) {
            res.status(400).json({ error: `Missing or invalid: ${errors.join(", ")}` });
            return;
        }
        const template = await builderTemplate_model_1.default.findOne({ slug: str(config.templateSlug, 80).toLowerCase(), published: true }).lean();
        if (!template || template.category !== category) {
            res.status(400).json({ error: "Template not found for this category" });
            return;
        }
        const tier = planTier;
        if ((0, builderShared_1.planRank)(tier) < (0, builderShared_1.planRank)(template.minPlan)) {
            res.status(400).json({ error: `This template needs the ${template.minPlan} plan or higher` });
            return;
        }
        // Pages must come from the template's list; home is always included.
        const requested = Array.isArray(config.pages) ? config.pages.filter((p) => typeof p === "string") : [];
        const offered = template.pageKeys?.length ? template.pageKeys : ["home"];
        const pages = offered.filter((p) => p === "home" || requested.includes(p));
        if (!pages.includes("home"))
            pages.unshift("home");
        let quote;
        try {
            quote = (0, builderQuote_1.computeQuote)({ planTier: tier, addonKeys, billing, pageCount: pages.length }, await quoteCatalog(), market);
        }
        catch (err) {
            if (err instanceof builderQuote_1.QuoteError) {
                res.status(400).json({ error: err.message });
                return;
            }
            throw err;
        }
        const assetUrls = Array.isArray(brand.assetUrls) ? brand.assetUrls.filter(isBuilderAssetUrl).slice(0, 6) : [];
        const order = new builderOrder_model_1.default({
            ref: newOrderRef(),
            country,
            market,
            locale,
            config: {
                category,
                goal: str(config.goal, 40) || undefined,
                templateSlug: template.slug,
                pages,
                planTier: tier,
                addonKeys: quote.lines.filter((l) => !l.key.startsWith("plan:")).map((l) => l.key),
                billing,
            },
            brand: {
                businessName,
                primary: HEX.test(str(brand.primary)) ? str(brand.primary) : template.defaultBrand.primary,
                accent: HEX.test(str(brand.accent)) ? str(brand.accent) : template.defaultBrand.accent,
                font: str(brand.font, 40) || template.defaultBrand.font,
                mode: (0, builderShared_1.isOneOf)(builderShared_1.THEME_MODES, brand.mode) ? brand.mode : template.mode,
                corners: (0, builderShared_1.isOneOf)(builderShared_1.CORNER_STYLES, brand.corners) ? brand.corners : template.corners,
                tone: str(brand.tone, 40) || undefined,
                logoUrl: isBuilderAssetUrl(brand.logoUrl) ? brand.logoUrl : undefined,
                assetUrls,
                notes: str(brand.notes, 2000) || undefined,
            },
            contact: { name, email, phone, company: str(contact.company, 120) || undefined },
            quote,
            attribution: (0, attribution_1.parseAttribution)(body.attribution),
            activity: [{ type: "created", message: "Order submitted on the website", at: new Date() }],
        });
        const lead = await serviceRequest_model_1.default.create({
            source: "builder",
            title: `Website order ${order.ref}: ${template.name.en} · ${tier}`,
            description: [
                `Business: ${businessName} (${country})`,
                `Template: ${template.name.en} (${template.slug}), plan ${tier}, billed ${billing}`,
                `Pages (${pages.length}): ${pages.join(", ")}`,
                `Add-ons: ${order.config.addonKeys.join(", ") || "none"}`,
                `Setup ${market} ${quote.setup}, monthly ${market} ${quote.monthly}, deposit ${market} ${quote.deposit}`,
                order.brand.notes ? `Notes: ${order.brand.notes}` : "",
            ]
                .filter(Boolean)
                .join("\n"),
            contactName: name,
            contactEmail: email,
            contactPhone: phone,
            company: order.contact.company ?? businessName,
            interest: "Website Builder",
            status: "Pending Review",
            value: quote.setup,
            currency: market,
            attribution: order.attribution,
            locale,
        });
        order.lead = lead._id;
        // Online deposit: charged in the quote currency when the provider supports it, otherwise converted
        // (e.g. AED price list → USD charge at Kashier's rate). No plan → the team invoices.
        let checkoutUrl;
        const plan = payNow && quote.deposit > 0 ? await (0, payments_1.paymentPlan)(market) : undefined;
        if (plan) {
            const { provider, chargeCurrency, rate } = plan;
            const amount = (0, fx_1.convert)(quote.deposit, rate);
            try {
                const session = await provider.createCheckout({
                    ref: order.ref,
                    amount,
                    currency: chargeCurrency,
                    description: `Xaeon website deposit ${order.ref}`,
                    customer: { name, email, phone },
                    locale,
                    returnUrl: successUrl(order),
                    webhookUrl: `${apiOrigin()}/api/v1/builder/payments/${provider.name}/webhook`,
                });
                order.status = "awaiting_payment";
                order.payment = {
                    provider: provider.name,
                    sessionId: session.sessionId,
                    status: "pending",
                    amount,
                    currency: chargeCurrency,
                    ...(chargeCurrency !== market ? { rate } : {}),
                };
                order.activity.push({
                    type: "payment",
                    message: chargeCurrency === market
                        ? `Checkout started with ${provider.name}`
                        : `Checkout started with ${provider.name}: ${market} ${quote.deposit} charged as ${chargeCurrency} ${amount.toFixed(2)} (rate ${rate})`,
                    at: new Date(),
                });
                checkoutUrl = session.url;
            }
            catch (err) {
                console.error(err);
                order.activity.push({ type: "payment", message: `Checkout could not start (${provider.name}); team will send a payment link`, at: new Date() });
            }
        }
        if (!payNow)
            order.activity.push({ type: "payment", message: "Customer chose to send the order without paying now", at: new Date() });
        await order.save();
        const results = await Promise.allSettled([(0, builderEmails_1.sendBuilderOrderNotice)(order), (0, builderEmails_1.sendBuilderOrderConfirmation)(order)]);
        for (const r of results)
            if (r.status === "rejected")
                console.error(r.reason);
        res.status(201).json({
            ref: order.ref,
            token: orderToken(order.ref),
            status: order.status,
            quote,
            ...(checkoutUrl ? { checkoutUrl, charge: { amount: order.payment.amount, currency: order.payment.currency } } : {}),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to submit the order") });
    }
};
exports.createOrder = createOrder;
const getOrderStatus = async (req, res) => {
    try {
        const ref = String(req.params.ref ?? "").toUpperCase();
        const token = String(req.query.token ?? "");
        const expected = orderToken(ref);
        if (token.length !== expected.length || !crypto_1.default.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        const order = await builderOrder_model_1.default.findOne({ ref }).select("ref status payment.status brand.businessName quote.deposit quote.currency").lean();
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.status(200).json({
            ref: order.ref,
            status: order.status,
            paymentStatus: order.payment?.status ?? "none",
            businessName: order.brand.businessName,
            deposit: order.quote.deposit,
            currency: order.quote.currency,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: (0, serverError_1.serverErrorMessage)(err, "Failed to load the order") });
    }
};
exports.getOrderStatus = getOrderStatus;
/* ───────────── payments ───────────── */
/** Marks an order's deposit paid (webhook or staff). Idempotent. Returns false if it was already paid. */
async function markOrderPaid(order, source) {
    if (order.payment.status === "paid")
        return false;
    order.payment.status = "paid";
    order.payment.provider = source.provider;
    order.payment.paidAt = new Date();
    order.payment.lastEvent = source.event;
    order.payment.amount = order.payment.amount ?? order.quote.deposit;
    order.payment.currency = order.payment.currency ?? order.quote.currency;
    if (order.status === "submitted" || order.status === "awaiting_payment")
        order.status = "paid";
    order.activity.push({ type: "payment", message: `Deposit paid (${source.provider})`, byName: source.byName, at: new Date() });
    await order.save();
    if (order.lead) {
        const lead = await serviceRequest_model_1.default.findById(order.lead);
        if (lead && lead.stage !== "won") {
            lead.stage = "won";
            lead.activity.push({ type: "stage", message: `Stage → won (deposit paid on ${order.ref})`, at: new Date() });
            await lead.save();
        }
    }
    await (0, builderEmails_1.sendBuilderPaymentReceived)(order);
    return true;
}
const paymentWebhook = async (req, res) => {
    const provider = (0, payments_1.getProvider)(String(req.params.provider ?? ""));
    if (!provider || !provider.configured()) {
        res.status(404).json({ error: "Unknown provider" });
        return;
    }
    try {
        const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
        const result = provider.parseWebhook({ headers: req.headers, rawBody, body: req.body });
        if (!result) {
            res.status(200).json({ received: true });
            return;
        }
        const order = await builderOrder_model_1.default.findOne({ ref: result.ref.toUpperCase() });
        if (!order) {
            res.status(200).json({ received: true });
            return;
        }
        const expectedCurrency = order.payment.currency ?? order.quote.currency;
        const expectedAmount = order.payment.amount ?? order.quote.deposit;
        const mismatch = (result.currency !== undefined && result.currency !== expectedCurrency) ||
            (result.amount !== undefined && Math.abs(result.amount - expectedAmount) > 0.01);
        if (result.status === "paid" && mismatch) {
            // Signed, but not what we asked for: leave it for staff to check instead of marking paid.
            order.payment.lastEvent = result.event;
            order.activity.push({
                type: "payment",
                message: `Payment reported as ${result.currency ?? "?"} ${result.amount ?? "?"} but ${expectedCurrency} ${expectedAmount} was expected — check ${provider.name}`,
                at: new Date(),
            });
            await order.save();
        }
        else if (result.status === "paid") {
            await markOrderPaid(order, { provider: provider.name, event: result.event });
        }
        else if (order.payment.status !== "paid") {
            order.payment.status = result.status;
            order.payment.lastEvent = result.event;
            order.activity.push({ type: "payment", message: `Payment ${result.status} (${provider.name})`, at: new Date() });
            await order.save();
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        if (err instanceof payments_1.WebhookSignatureError) {
            res.status(401).json({ error: "Invalid signature" });
            return;
        }
        console.error(err);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};
exports.paymentWebhook = paymentWebhook;
