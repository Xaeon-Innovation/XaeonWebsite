import crypto, { randomUUID } from "crypto";
import type { Request, Response } from "express";
import multer from "multer";

import { getUploadPublicBase } from "../config/siteUpload.config";
import BuilderAddon from "../models/builderAddon.model";
import BuilderOrder, { type IBuilderOrder } from "../models/builderOrder.model";
import BuilderPlan from "../models/builderPlan.model";
import BuilderTemplate from "../models/builderTemplate.model";
import { BUILDER_CATEGORIES, COUNTRIES, COUNTRY_MARKET, MARKETS, PLAN_TIERS, isOneOf, planRank } from "../models/builderShared";
import ServiceRequest from "../models/serviceRequest.model";
import { sendBuilderOrderConfirmation, sendBuilderOrderNotice, sendBuilderPaymentReceived } from "../services/builderEmails";
import { getProvider, paymentOptions, providerFor, WebhookSignatureError } from "../services/payments";
import { putObject } from "../services/storage";
import { parseAttribution } from "../utils/attribution";
import { computeQuote, QuoteError, type QuoteAddon, type QuotePlan } from "../utils/builderQuote";
import { MAX_SVG_BYTES, rasterToWebp } from "../utils/processSiteImage";
import { serverErrorMessage } from "../utils/serverError";

/** Public Website Builder API. Admin side: builderAdmin.controller.ts. */

const siteOrigin = () => (process.env.SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");
const apiOrigin = () => (process.env.API_PUBLIC_URL || "https://api.xaeons.com").replace(/\/+$/, "");

/* ───────────── catalog ───────────── */

const PUBLIC_TEMPLATE_FIELDS = "slug category name tagline previewImageUrl layout defaultBrand pages features recommendedAddons minPlan";
const PUBLIC_ADDON_FIELDS = "key kind name description icon prices quoted discountPercent badge includedIn minPlan categories";
const PUBLIC_PLAN_FIELDS = "tier name summary prices quoted features highlighted";

export const getCatalog = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sort = { sortOrder: 1 as const, createdAt: 1 as const };
    const [templates, addons, plans] = await Promise.all([
      BuilderTemplate.find({ published: true }).sort(sort).select(PUBLIC_TEMPLATE_FIELDS).lean(),
      BuilderAddon.find({ published: true }).sort(sort).select(PUBLIC_ADDON_FIELDS).lean(),
      BuilderPlan.find({ published: true }).sort(sort).select(PUBLIC_PLAN_FIELDS).lean(),
    ]);
    // Payment options per market, so the wizard can show them once the customer picks a country.
    const payments = Object.fromEntries(MARKETS.map((m) => [m, paymentOptions(m)]));
    res.status(200).json({ templates, addons, plans, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to load the builder catalog") });
  }
};

async function quoteCatalog(): Promise<{ plans: QuotePlan[]; addons: QuoteAddon[] }> {
  const [plans, addons] = await Promise.all([BuilderPlan.find({ published: true }).lean(), BuilderAddon.find({ published: true }).lean()]);
  return {
    plans: plans.map((p) => ({ tier: p.tier, name: p.name.en, prices: p.prices, quoted: p.quoted })),
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.mimetype));
  },
});

export const builderAssetMiddleware = upload.single("file");

/** Customer logo / brand images. Always re-encoded to WebP (SVG is rasterised: stored SVG can carry script). */
export const uploadBuilderAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.body?.type === "logo" ? "logo" : "asset";
    if (!req.file) {
      res.status(400).json({ error: "Missing file (jpeg, png, webp or svg)" });
      return;
    }
    if (req.file.mimetype === "image/svg+xml" && req.file.size > MAX_SVG_BYTES) {
      res.status(400).json({ error: "SVG too large (max 200KB)" });
      return;
    }
    const base = getUploadPublicBase(req);
    if (!base) {
      res.status(500).json({ error: "Uploads are not configured" });
      return;
    }
    const outBuf = await rasterToWebp(req.file.buffer, type === "logo" ? "logo" : "blog");
    const url = await putObject(`builder/${randomUUID()}.webp`, outBuf, "image/webp", base);
    res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "That image could not be processed. Try a JPG or PNG under 10MB." });
  }
};

/** Only URLs we issued from the upload endpoint above are accepted on orders. */
function isBuilderAssetUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  const prefixes = [`${apiOrigin()}/uploads/builder/`];
  const s3 = process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (s3) prefixes.push(`${s3}/builder/`);
  return prefixes.some((p) => url.startsWith(p)) && /^[\w:/.-]+$/.test(url);
}

/* ───────────── orders ───────────── */

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newOrderRef(): string {
  const bytes = crypto.randomBytes(6);
  return `XB-${[...bytes].map((b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`;
}

/** Lets the success page read an order's status without logging in; only the customer has the link. */
export function orderToken(ref: string): string {
  return crypto.createHmac("sha256", process.env.JWT_SECRET ?? "").update(`builder-order:${ref}`).digest("hex").slice(0, 32);
}

function successUrl(order: IBuilderOrder): string {
  const prefix = order.locale === "ar" ? "/ar" : "";
  return `${siteOrigin()}${prefix}/website-builder/success?ref=${encodeURIComponent(order.ref)}&token=${orderToken(order.ref)}`;
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const HEX = /^#[0-9a-f]{6}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.order as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "order payload is required" });
      return;
    }
    const config = (body.config ?? {}) as Record<string, unknown>;
    const brand = (body.brand ?? {}) as Record<string, unknown>;
    const contact = (body.contact ?? {}) as Record<string, unknown>;

    // The country decides the currency; a `market` sent by the browser is ignored.
    const country = isOneOf(COUNTRIES, body.country) ? body.country : undefined;
    const market = COUNTRY_MARKET[country ?? "EG"];
    const locale = body.locale === "ar" ? "ar" : "en";
    const category = config.category;
    const planTier = config.planTier;
    const billing = config.billing === "annual" ? "annual" : "monthly";
    const addonKeys = Array.isArray(config.addonKeys) ? config.addonKeys.filter((k): k is string => typeof k === "string").slice(0, 30) : [];

    const name = str(contact.name, 120);
    const email = str(contact.email, 200).toLowerCase();
    const phone = str(contact.phone, 40);
    const businessName = str(brand.businessName, 120);

    const errors: string[] = [];
    if (!country) errors.push("country");
    if (!isOneOf(BUILDER_CATEGORIES, category)) errors.push("config.category");
    if (!isOneOf(PLAN_TIERS, planTier)) errors.push("config.planTier");
    if (!name) errors.push("contact.name");
    if (!EMAIL.test(email)) errors.push("contact.email");
    if (phone.replace(/\D/g, "").length < 7) errors.push("contact.phone");
    if (!businessName) errors.push("brand.businessName");
    if (errors.length) {
      res.status(400).json({ error: `Missing or invalid: ${errors.join(", ")}` });
      return;
    }

    const template = await BuilderTemplate.findOne({ slug: str(config.templateSlug, 80).toLowerCase(), published: true }).lean();
    if (!template || template.category !== category) {
      res.status(400).json({ error: "Template not found for this category" });
      return;
    }
    const tier = planTier as (typeof PLAN_TIERS)[number];
    if (planRank(tier) < planRank(template.minPlan)) {
      res.status(400).json({ error: `This template needs the ${template.minPlan} plan or higher` });
      return;
    }

    let quote;
    try {
      quote = computeQuote({ planTier: tier, addonKeys, billing }, await quoteCatalog(), market);
    } catch (err) {
      if (err instanceof QuoteError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }

    const assetUrls = Array.isArray(brand.assetUrls) ? brand.assetUrls.filter(isBuilderAssetUrl).slice(0, 6) : [];
    const order = new BuilderOrder({
      ref: newOrderRef(),
      country,
      market,
      locale,
      config: {
        category,
        goal: str(config.goal, 40) || undefined,
        templateSlug: template.slug,
        planTier: tier,
        addonKeys: quote.lines.filter((l) => !l.key.startsWith("plan:")).map((l) => l.key),
        billing,
      },
      brand: {
        businessName,
        primary: HEX.test(str(brand.primary)) ? str(brand.primary) : template.defaultBrand.primary,
        accent: HEX.test(str(brand.accent)) ? str(brand.accent) : template.defaultBrand.accent,
        font: str(brand.font, 40) || template.defaultBrand.font,
        tone: str(brand.tone, 40) || undefined,
        logoUrl: isBuilderAssetUrl(brand.logoUrl) ? brand.logoUrl : undefined,
        assetUrls,
        notes: str(brand.notes, 2000) || undefined,
      },
      contact: { name, email, phone, company: str(contact.company, 120) || undefined },
      quote,
      attribution: parseAttribution(body.attribution),
      activity: [{ type: "created", message: "Order submitted on the website", at: new Date() }],
    });

    const lead = await ServiceRequest.create({
      source: "builder",
      title: `Website order ${order.ref}: ${template.name.en} · ${tier}`,
      description: [
        `Business: ${businessName} (${country})`,
        `Template: ${template.name.en} (${template.slug}), plan ${tier}, billed ${billing}`,
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
    order.lead = lead._id as typeof order.lead;

    // Online deposit when a provider handles this currency and there is a fixed amount to pay.
    let checkoutUrl: string | undefined;
    const provider = quote.deposit > 0 ? providerFor(market) : undefined;
    if (provider) {
      try {
        const session = await provider.createCheckout({
          ref: order.ref,
          amount: quote.deposit,
          currency: market,
          description: `Xaeon website deposit ${order.ref}`,
          customer: { name, email, phone },
          locale,
          returnUrl: successUrl(order),
          webhookUrl: `${apiOrigin()}/api/v1/builder/payments/${provider.name}/webhook`,
        });
        order.status = "awaiting_payment";
        order.payment = { provider: provider.name, sessionId: session.sessionId, status: "pending", amount: quote.deposit };
        order.activity.push({ type: "payment", message: `Checkout started with ${provider.name}`, at: new Date() });
        checkoutUrl = session.url;
      } catch (err) {
        console.error(err);
        order.activity.push({ type: "payment", message: `Checkout could not start (${provider.name}); team will send a payment link`, at: new Date() });
      }
    }
    await order.save();

    const results = await Promise.allSettled([sendBuilderOrderNotice(order), sendBuilderOrderConfirmation(order)]);
    for (const r of results) if (r.status === "rejected") console.error(r.reason);

    res.status(201).json({
      ref: order.ref,
      token: orderToken(order.ref),
      status: order.status,
      quote,
      ...(checkoutUrl ? { checkoutUrl } : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to submit the order") });
  }
};

export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const ref = String(req.params.ref ?? "").toUpperCase();
    const token = String(req.query.token ?? "");
    const expected = orderToken(ref);
    if (token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const order = await BuilderOrder.findOne({ ref }).select("ref status payment.status brand.businessName quote.deposit quote.currency").lean();
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: serverErrorMessage(err, "Failed to load the order") });
  }
};

/* ───────────── payments ───────────── */

/** Marks an order's deposit paid (webhook or staff). Idempotent. Returns false if it was already paid. */
export async function markOrderPaid(order: IBuilderOrder, source: { provider: string; event: string; byName?: string }): Promise<boolean> {
  if (order.payment.status === "paid") return false;
  order.payment.status = "paid";
  order.payment.provider = source.provider;
  order.payment.paidAt = new Date();
  order.payment.lastEvent = source.event;
  order.payment.amount = order.payment.amount ?? order.quote.deposit;
  if (order.status === "submitted" || order.status === "awaiting_payment") order.status = "paid";
  order.activity.push({ type: "payment", message: `Deposit paid (${source.provider})`, byName: source.byName, at: new Date() });
  await order.save();

  if (order.lead) {
    const lead = await ServiceRequest.findById(order.lead);
    if (lead && lead.stage !== "won") {
      lead.stage = "won";
      lead.activity.push({ type: "stage", message: `Stage → won (deposit paid on ${order.ref})`, at: new Date() } as (typeof lead.activity)[number]);
      await lead.save();
    }
  }
  await sendBuilderPaymentReceived(order);
  return true;
}

export const paymentWebhook = async (req: Request, res: Response): Promise<void> => {
  const provider = getProvider(String(req.params.provider ?? ""));
  if (!provider || !provider.configured()) {
    res.status(404).json({ error: "Unknown provider" });
    return;
  }
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const result = provider.parseWebhook({ headers: req.headers, rawBody, body: req.body });
    if (!result) {
      res.status(200).json({ received: true });
      return;
    }
    const order = await BuilderOrder.findOne({ ref: result.ref.toUpperCase() });
    if (!order) {
      res.status(200).json({ received: true });
      return;
    }
    if (result.status === "paid") {
      await markOrderPaid(order, { provider: provider.name, event: result.event });
    } else if (order.payment.status !== "paid") {
      order.payment.status = result.status;
      order.payment.lastEvent = result.event;
      order.activity.push({ type: "payment", message: `Payment ${result.status} (${provider.name})`, at: new Date() });
      await order.save();
    }
    res.status(200).json({ received: true });
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
