import crypto from "crypto";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type TestAgent from "supertest/lib/agent";

// Capture emails instead of sending them.
const sent: { to: unknown; subject: string; html: string }[] = [];
vi.mock("../src/services/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/email")>();
  return {
    ...actual,
    resendConfigured: () => true,
    sendEmail: vi.fn(async (input: { to: unknown; subject: string; html: string }) => {
      sent.push(input);
      return { id: "test" };
    }),
  };
});

import { adminAgent, app } from "./helpers";
import BuilderAddon from "../src/models/builderAddon.model";
import BuilderOrder from "../src/models/builderOrder.model";
import BuilderPlan from "../src/models/builderPlan.model";
import BuilderTemplate from "../src/models/builderTemplate.model";
import ServiceRequest from "../src/models/serviceRequest.model";
import Star from "../src/models/star.model";
import { kashierSignaturePayload } from "../src/services/payments/kashier";
import { polarSignature } from "../src/services/payments/polar";
import { resetFxCache } from "../src/services/payments/fx";
import { addonDocs, planDocs, templateDocs } from "../scripts/builderCatalogData";

let admin: TestAgent;

function order(overrides: Record<string, unknown> = {}) {
  return {
    order: {
      country: "EG",
      market: "USD", // ignored: the country decides the currency
      locale: "en",
      config: { category: "clinics", templateSlug: "clinic-care", planTier: "business", addonKeys: ["booking", "mobile-app"], billing: "monthly", pages: ["home", "services", "booking", "contact"] },
      brand: { businessName: "Delta Clinics", primary: "#123456", accent: "#abcdef", font: "modern", logoUrl: "https://evil.example/x.png" },
      contact: { name: "Mona Adel", email: "Mona@Example.com", phone: "+20 100 000 0001" },
      // Prices sent by a browser must be ignored.
      quote: { setup: 1, deposit: 1 },
      attribution: { utmSource: "google" },
      ...overrides,
    },
  };
}

beforeAll(async () => {
  admin = await adminAgent();
  await BuilderPlan.insertMany(planDocs());
  await BuilderAddon.insertMany(addonDocs());
  await BuilderTemplate.insertMany(templateDocs());
  await BuilderTemplate.create({ slug: "draft-tpl", category: "clinics", name: { en: "Draft", ar: "" }, published: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  resetFxCache();
  delete process.env.PAYMENT_PROVIDERS;
  delete process.env.KASHIER_MERCHANT_ID;
  delete process.env.KASHIER_API_KEY;
  delete process.env.KASHIER_CURRENCIES;
  delete process.env.KASHIER_METHODS;
  delete process.env.POLAR_ACCESS_TOKEN;
  delete process.env.POLAR_WEBHOOK_SECRET;
  delete process.env.POLAR_DEPOSIT_PRODUCT_ID;
});

describe("builder catalog", () => {
  it("returns only published items", async () => {
    const res = await request(app).get("/api/v1/builder/catalog");
    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(40);
    expect(res.body.templates[0]).toMatchObject({ slug: "clinic-care", hero: "split", mode: "light", corners: "soft", defaultPages: expect.arrayContaining(["home", "booking"]) });
    expect(res.body.plans[0]).toMatchObject({ tier: "launch", includedPages: 1, extraPagePrice: { EGP: 1000 } });
    expect(res.body.templates.some((t: { slug: string }) => t.slug === "draft-tpl")).toBe(false);
    expect(res.body.plans.map((p: { tier: string }) => p.tier)).toEqual(["launch", "business", "growth", "custom"]);
    expect(res.body.addons.find((a: { key: string }) => a.key === "mobile-app").discountPercent).toBe(15);
    expect(res.body.payments).toEqual({ EGP: { online: false, methods: [] }, AED: { online: false, methods: [] }, USD: { online: false, methods: [] } });
  });

  it("lists Kashier's payment options for the currencies it is enabled for", async () => {
    process.env.PAYMENT_PROVIDERS = "kashier";
    process.env.KASHIER_MERCHANT_ID = "MID-1-2";
    process.env.KASHIER_API_KEY = "k";
    process.env.KASHIER_CURRENCIES = "EGP";
    process.env.KASHIER_METHODS = "card,wallet,bank_installments";
    const res = await request(app).get("/api/v1/builder/catalog");
    expect(res.body.payments.EGP).toEqual({ online: true, provider: "kashier", methods: ["card", "wallet", "bank_installments"] });
    expect(res.body.payments.USD).toEqual({ online: false, methods: [] });
  });
});

describe("builder orders", () => {
  it("computes the quote on the server, creates a CRM lead and emails staff + customer", async () => {
    sent.length = 0;
    const res = await request(app).post("/api/v1/builder/orders").send(order());
    expect(res.status).toBe(201);
    expect(res.body.ref).toMatch(/^XB-[A-Z0-9]{6}$/);
    expect(res.body.checkoutUrl).toBeUndefined();
    // Business 16,500 + booking 2,500 + app 60,000 − 15% (from-price, excluded from deposit).
    expect(res.body.quote).toMatchObject({ setup: 16500 + 2500 + 51000, deposit: (16500 + 2500) / 2, discountTotal: 9000 });

    const saved = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(saved?.status).toBe("submitted");
    expect(saved).toMatchObject({ country: "EG", market: "EGP" });
    expect(saved?.contact.email).toBe("mona@example.com");
    expect(saved?.brand.logoUrl).toBeUndefined(); // foreign URL dropped
    const lead = await ServiceRequest.findById(saved?.lead).lean();
    expect(lead).toMatchObject({ source: "builder", interest: "Website Builder", value: 70000, currency: "EGP", stage: "new" });
    expect(lead?.attribution?.utmSource).toBe("google");
    expect(sent.map((m) => m.subject).join("\n")).toMatch(/New website order XB-.*Delta Clinics/);
    expect(sent.map((m) => m.subject).join("\n")).toMatch(/We received your website order/);
  });

  it("keeps only pages the template offers, always with home, and prices extra pages", async () => {
    const res = await request(app)
      .post("/api/v1/builder/orders")
      .send(order({ config: { category: "clinics", templateSlug: "clinic-care", planTier: "launch", pages: ["services", "team", "contact", "menu", "nope"] } }));
    expect(res.status).toBe(201);
    const saved = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(saved?.config.pages).toEqual(["home", "services", "team", "contact"]); // template order, "menu" isn't offered
    expect(res.body.quote.pages).toEqual({ count: 4, included: 1, extra: 3 });
    expect(res.body.quote.setup).toBe(7500 + 3000);
  });

  it("validates category, template and plan", async () => {
    expect((await request(app).post("/api/v1/builder/orders").send(order({ config: { category: "spaceships", templateSlug: "clinic-care", planTier: "launch" } }))).status).toBe(400);
    expect((await request(app).post("/api/v1/builder/orders").send(order({ config: { category: "clinics", templateSlug: "draft-tpl", planTier: "launch" } }))).status).toBe(400);
    expect((await request(app).post("/api/v1/builder/orders").send(order({ config: { category: "clinics", templateSlug: "medica-plus", planTier: "launch" } }))).body.error).toMatch(/business/);
    expect((await request(app).post("/api/v1/builder/orders").send(order({ contact: { name: "x", email: "bad", phone: "1" } }))).status).toBe(400);
    expect((await request(app).post("/api/v1/builder/orders").send(order({ country: "Mars" }))).body.error).toMatch(/country/);
  });

  it("honeypot fakes success without saving", async () => {
    const before = await BuilderOrder.countDocuments();
    const res = await request(app).post("/api/v1/builder/orders").send({ ...order(), website: "spam" });
    expect(res.status).toBe(201);
    expect(await BuilderOrder.countDocuments()).toBe(before);
  });

  it("status needs the signed token", async () => {
    const res = await request(app).post("/api/v1/builder/orders").send(order());
    expect((await request(app).get(`/api/v1/builder/orders/${res.body.ref}/status?token=nope`)).status).toBe(404);
    const ok = await request(app).get(`/api/v1/builder/orders/${res.body.ref}/status?token=${res.body.token}`);
    expect(ok.body).toMatchObject({ ref: res.body.ref, status: "submitted", paymentStatus: "none", businessName: "Delta Clinics" });
  });
});

describe("payments", () => {
  function kashierEnv() {
    process.env.PAYMENT_PROVIDERS = "kashier,polar";
    process.env.KASHIER_MERCHANT_ID = "MID-1-2";
    process.env.KASHIER_API_KEY = "kashier-test-key";
  }

  it("Kashier: checkout URL, then a signed webhook marks the order and lead paid", async () => {
    kashierEnv();
    const res = await request(app).post("/api/v1/builder/orders").send(order({ config: { category: "clinics", templateSlug: "clinic-care", planTier: "launch", addonKeys: [] } }));
    expect(res.body.status).toBe("awaiting_payment");
    const url = new URL(res.body.checkoutUrl);
    expect(url.host).toBe("payments.kashier.io");
    expect(url.searchParams.get("amount")).toBe("7500.00");
    expect(url.searchParams.get("orderId")).toBe(res.body.ref);
    expect(url.searchParams.get("currency")).toBe("EGP");
    expect(url.searchParams.get("allowedMethods")).toBe("card,wallet");

    const data = { merchantOrderId: res.body.ref, status: "SUCCESS", amount: "7500", transactionId: "TX1", signatureKeys: ["merchantOrderId", "status", "amount"] };
    const bad = await request(app).post("/api/v1/builder/payments/kashier/webhook").set("x-kashier-signature", "00").send({ event: "pay", data });
    expect(bad.status).toBe(401);

    const signature = crypto.createHmac("sha256", "kashier-test-key").update(kashierSignaturePayload(data)).digest("hex");
    sent.length = 0;
    const good = await request(app).post("/api/v1/builder/payments/kashier/webhook").set("x-kashier-signature", signature).send({ event: "pay", data });
    expect(good.status).toBe(200);
    const saved = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(saved?.status).toBe("paid");
    expect(saved?.payment.status).toBe("paid");
    expect((await ServiceRequest.findById(saved?.lead).lean())?.stage).toBe("won");
    expect(sent.some((m) => /Payment received/.test(m.subject))).toBe(true);

    // Replays are harmless.
    sent.length = 0;
    await request(app).post("/api/v1/builder/payments/kashier/webhook").set("x-kashier-signature", signature).send({ event: "pay", data });
    expect(sent).toHaveLength(0);
  });

  it("Gulf orders (AED prices) are charged in USD at Kashier's rate", async () => {
    kashierEnv();
    process.env.KASHIER_CURRENCIES = "EGP,USD";
    const realFetch = globalThis.fetch;
    const fx = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/v3/payment/exchange-rate")) {
        expect(url).toContain("from=AED&to=USD");
        return new Response(JSON.stringify({ success: true, base: "AED", rates: { USD: 0.2723 } }), { status: 200 });
      }
      return realFetch(input, init);
    });

    const catalog = await request(app).get("/api/v1/builder/catalog");
    expect(catalog.body.payments.AED).toEqual({ online: true, provider: "kashier", methods: ["card", "wallet"], chargeCurrency: "USD", rate: 0.2723 });
    expect(catalog.body.payments.EGP.chargeCurrency).toBeUndefined();

    // Business 2,250 + booking 350 = 2,600 AED setup → 1,300 AED deposit → USD 353.99.
    const res = await request(app).post("/api/v1/builder/orders").send(order({ country: "AE" }));
    expect(res.body.quote).toMatchObject({ currency: "AED", deposit: 1300 });
    expect(res.body.charge).toEqual({ amount: 353.99, currency: "USD" });
    const url = new URL(res.body.checkoutUrl);
    expect(url.searchParams.get("currency")).toBe("USD");
    expect(url.searchParams.get("amount")).toBe("353.99");
    const saved = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(saved?.payment).toMatchObject({ amount: 353.99, currency: "USD", rate: 0.2723, status: "pending" });
    expect(fx).toHaveBeenCalledTimes(1); // cached for the order after the catalog lookup

    // The webhook must report the converted amount/currency, not the AED price.
    const wrong = { merchantOrderId: res.body.ref, status: "SUCCESS", amount: "1300", currency: "AED", signatureKeys: ["merchantOrderId", "status", "amount", "currency"] };
    const sign = (d: Record<string, unknown>) => crypto.createHmac("sha256", "kashier-test-key").update(kashierSignaturePayload(d)).digest("hex");
    await request(app).post("/api/v1/builder/payments/kashier/webhook").set("x-kashier-signature", sign(wrong)).send({ event: "pay", data: wrong });
    expect((await BuilderOrder.findOne({ ref: res.body.ref }).lean())?.payment.status).toBe("pending");

    const right = { ...wrong, amount: "353.99", currency: "USD" };
    await request(app).post("/api/v1/builder/payments/kashier/webhook").set("x-kashier-signature", sign(right)).send({ event: "pay", data: right });
    const paid = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(paid?.payment.status).toBe("paid");
    expect(paid?.activity.map((a) => a.message).join("\n")).toMatch(/expected/);
    expect(sent.some((m) => m.html.includes("USD 353.99"))).toBe(true);
  });

  it("uses the official peg when Kashier's rate lookup is down", async () => {
    kashierEnv();
    process.env.KASHIER_CURRENCIES = "EGP,USD";
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) =>
      String(input).includes("exchange-rate") ? new Response("{}", { status: 503 }) : realFetch(input, init),
    );
    const res = await request(app).post("/api/v1/builder/orders").send(order({ country: "SA" }));
    expect(res.body.charge).toEqual({ amount: Math.round((1300 / 3.6725) * 100) / 100, currency: "USD" });
  });

  it("send without paying: no checkout even when Kashier is set up", async () => {
    kashierEnv();
    const res = await request(app).post("/api/v1/builder/orders").send(order({ payNow: false }));
    expect(res.body.status).toBe("submitted");
    expect(res.body.checkoutUrl).toBeUndefined();
    const saved = await BuilderOrder.findOne({ ref: res.body.ref }).lean();
    expect(saved?.activity.map((a) => a.message).join(" ")).toMatch(/without paying/);
  });

  it("any ISO country works; currency follows it", async () => {
    const de = await request(app).post("/api/v1/builder/orders").send(order({ country: "de" }));
    expect(de.body.quote.currency).toBe("USD");
    const kw = await request(app).post("/api/v1/builder/orders").send(order({ country: "KW" }));
    expect(kw.body.quote.currency).toBe("AED");
  });

  it("falls back to a manual order when no provider supports the currency", async () => {
    kashierEnv();
    process.env.KASHIER_CURRENCIES = "EGP"; // account without USD: Gulf orders can't be converted
    const res = await request(app).post("/api/v1/builder/orders").send(order({ country: "AE" }));
    expect(res.body.quote.currency).toBe("AED");
    expect(res.body.status).toBe("submitted");
    expect(res.body.checkoutUrl).toBeUndefined();
  });

  it("Polar: verifies Standard Webhooks signatures on order.paid", async () => {
    process.env.POLAR_ACCESS_TOKEN = "tok";
    process.env.POLAR_WEBHOOK_SECRET = "polar-secret";
    process.env.POLAR_DEPOSIT_PRODUCT_ID = "prod";
    const created = await request(app).post("/api/v1/builder/orders").send(order({ country: "DE" }));
    const body = JSON.stringify({ type: "order.paid", data: { id: "ord_1", checkout_id: "co_1", metadata: { ref: created.body.ref } } });
    const id = "msg_1";
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = polarSignature("polar-secret", id, ts, Buffer.from(body));

    const bad = await request(app).post("/api/v1/builder/payments/polar/webhook").set({ "content-type": "application/json", "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": "v1,AAAA" }).send(body);
    expect(bad.status).toBe(401);
    const good = await request(app).post("/api/v1/builder/payments/polar/webhook").set({ "content-type": "application/json", "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` }).send(body);
    expect(good.status).toBe(200);
    expect((await BuilderOrder.findOne({ ref: created.body.ref }).lean())?.payment.status).toBe("paid");
  });

  it("unknown or unconfigured providers 404", async () => {
    expect((await request(app).post("/api/v1/builder/payments/kashier/webhook").send({})).status).toBe(404);
    expect((await request(app).post("/api/v1/builder/payments/paypal/webhook").send({})).status).toBe(404);
  });
});

describe("brand uploads", () => {
  it("rejects non-images", async () => {
    const res = await request(app).post("/api/v1/builder/assets").attach("file", Buffer.from("hello"), { filename: "x.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });
});

describe("admin builder", () => {
  it("requires admin", async () => {
    expect((await request(app).get("/api/v1/admin/builder/orders")).status).toBe(401);
  });

  it("CRUD on add-ons with whitelisted fields", async () => {
    const created = await admin.post("/api/v1/admin/builder/addons").send({ addon: { key: "Live Chat", name: { en: "Live chat", ar: "دردشة" }, prices: { EGP: { setup: 900 } }, published: true, evil: 1 } });
    expect(created.status).toBe(201);
    expect(created.body.addon).toMatchObject({ key: "live-chat", prices: { EGP: { setup: 900, monthly: 0 } } });
    expect(created.body.addon.evil).toBeUndefined();
    const dup = await admin.post("/api/v1/admin/builder/addons").send({ addon: { key: "live-chat", name: "Again" } });
    expect(dup.status).toBe(409);
    const updated = await admin.put("/api/v1/admin/builder/addons").send({ addon: { id: created.body.addon._id, discountPercent: 20 } });
    expect(updated.body.addon.discountPercent).toBe(20);
    expect((await admin.delete(`/api/v1/admin/builder/addons/${created.body.addon._id}`)).status).toBe(200);
  });

  it("orders: list, status change, mark paid by staff", async () => {
    const created = await request(app).post("/api/v1/builder/orders").send(order());
    const list = await admin.get("/api/v1/admin/builder/orders?status=submitted");
    const row = list.body.orders.find((o: { ref: string }) => o.ref === created.body.ref);
    expect(row).toBeTruthy();
    const paid = await admin.patch(`/api/v1/admin/builder/orders/${row._id}`).send({ markPaid: true, note: "Paid by bank transfer" });
    expect(paid.body.order).toMatchObject({ status: "paid", payment: { status: "paid", provider: "manual" } });
    const building = await admin.patch(`/api/v1/admin/builder/orders/${row._id}`).send({ status: "in_build" });
    expect(building.body.order.status).toBe("in_build");
    expect(building.body.order.activity.map((a: { type: string }) => a.type)).toEqual(expect.arrayContaining(["created", "payment", "note", "status"]));
  });
});

describe("galaxy of stars", () => {
  it("public list shows published stars only", async () => {
    await admin.post("/api/v1/admin/builder/stars").send({ star: { name: "Delta Clinics", product: "velora", magnitude: 3, published: true } });
    await Star.create({ name: "Hidden", published: false });
    const res = await request(app).get("/api/v1/site/stars");
    expect(res.status).toBe(200);
    expect(res.body.stars.map((s: { name: string }) => s.name)).toEqual(["Delta Clinics"]);
    expect(res.body.stars[0]).toMatchObject({ product: "velora", magnitude: 3 });
  });
});
