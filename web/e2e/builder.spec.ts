import { expect, test } from "@playwright/test";

/** Website Builder, products (Polara / Velora) and the galaxy of stars. Mock catalog: e2e/mock-api.mjs. */

const MOCK = "http://127.0.0.1:4010";

async function lastRequest(path: string) {
  const all = (await (await fetch(`${MOCK}/__requests`)).json()) as { path: string; body: Record<string, any> }[];
  return all.filter((r) => r.path === path).at(-1)?.body;
}

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("website builder", () => {
  test.beforeEach(async ({ page }) => {
    // Every test starts without a saved draft (cleared once per tab, so reloads keep it).
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("e2e-draft-cleared")) return;
      window.localStorage.removeItem("xaeon-builder-draft-v1");
      window.sessionStorage.setItem("e2e-draft-cleared", "1");
    });
  });

  test("landing renders one h1, plans, cross-sells and no sideways scroll", async ({ page }) => {
    await page.goto("/website-builder");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Choose a proven website");
    await expect(page.getByRole("heading", { name: "Simple plans" })).toBeVisible();
    await expect(page.getByText("Save 15%").first()).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("full order: category → template → brand → add-ons → plan → review", async ({ page }) => {
    await page.goto("/website-builder?utm_source=google&utm_campaign=builder-e2e");
    const wizard = page.locator("#build");

    // Validation blocks an empty step.
    await wizard.getByRole("button", { name: "Continue" }).click();
    await expect(wizard.getByText("Choose your country.")).toBeVisible();
    await expect(wizard.getByText("Choose your business type.")).toBeVisible();

    // Country first: it decides currency and payment options.
    await wizard.getByRole("radio", { name: "Egypt" }).click();
    await expect(wizard.getByText("Prices in EGP for Egypt. · pay online by Bank cards (Visa, Mastercard, Meeza), Mobile wallets")).toBeVisible();
    await wizard.getByRole("radio", { name: /Clinics & healthcare/ }).click();
    await wizard.getByRole("button", { name: "Get calls & WhatsApp" }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();

    await expect(wizard.getByRole("heading", { name: "Pick a starting design" })).toBeFocused();
    await wizard.getByRole("radio", { name: /Clinic Care/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();

    await wizard.getByLabel("Business name").fill("Delta Clinics");
    await expect(wizard.getByText("© Delta Clinics")).toBeAttached(); // live preview
    await wizard.getByRole("button", { name: "Continue" }).click();

    // Booking was pre-selected from the template; add the discounted mobile app.
    await expect(wizard.getByRole("checkbox", { name: /Online booking/ })).toBeChecked();
    await wizard.getByText("Mobile app for your website").click();
    await wizard.getByRole("button", { name: "Continue" }).click();

    await expect(wizard.getByRole("radio", { name: /Business/ })).toHaveAttribute("aria-checked", "true");
    await wizard.getByRole("button", { name: "Annual (2 months free)" }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();

    await expect(wizard.getByText("Pay the EGP 9,500 deposit securely with Kashier")).toBeVisible();
    await expect(wizard.getByText("Mobile wallets")).toBeVisible();
    await wizard.getByRole("button", { name: "Continue to payment" }).click();
    await expect(wizard.getByText("Please accept the terms to continue.")).toBeVisible();
    await wizard.getByLabel("Full name").fill("Mona Adel");
    await wizard.getByLabel("Email").fill("mona@example.com");
    await wizard.getByLabel("Phone / WhatsApp").fill("+20 100 000 0001");
    await wizard.getByRole("checkbox", { name: /I agree/ }).check();
    await wizard.getByRole("button", { name: "Continue to payment" }).click();

    await expect(page).toHaveURL(/\/website-builder\/success\?ref=XB-TEST01&token=tok/);
    await expect(page.locator("h1")).toHaveText("Welcome to our galaxy");
    await expect(page.getByText("Your order XB-TEST01 is in.")).toBeVisible();

    const body = await lastRequest("/api/v1/builder/orders");
    expect(body?.order).toMatchObject({
      country: "EG",
      locale: "en",
      config: { category: "clinics", goal: "calls", templateSlug: "clinic-care", planTier: "business", billing: "annual" },
      brand: { businessName: "Delta Clinics" },
      contact: { name: "Mona Adel", email: "mona@example.com" },
    });
    expect(body?.order.config.addonKeys).toEqual(expect.arrayContaining(["booking", "mobile-app"]));
    expect(body?.order.attribution.utmCampaign).toBe("builder-e2e");
    expect(body?.website).toBe("");
  });

  test("category deep link from Velora opens the template step, in Arabic", async ({ page }) => {
    await page.goto("/ar/products/velora");
    await expect(page.locator("h1")).toHaveCount(1);
    await page.getByRole("link", { name: "اربطه بموقع إلكتروني" }).click();
    await expect(page).toHaveURL(/\/ar\/website-builder\?category=clinics/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // No country yet: the wizard stays on the first step with clinics already chosen.
    const wizard = page.locator("#build");
    await expect(wizard.getByRole("radio", { name: /العيادات والرعاية الصحية/ })).toHaveAttribute("aria-checked", "true");
    await wizard.getByRole("radio", { name: "السعودية" }).click();
    await expect(wizard.getByText("الأسعار بعملة AED لـالسعودية.", { exact: false })).toBeVisible();
    await wizard.getByRole("button", { name: "متابعة" }).click();
    await expect(wizard.getByRole("heading", { name: "اختر تصميمًا للبداية" })).toBeVisible();
    // Medica Plus needs the Business plan.
    await expect(page.locator("#build").getByText("باقة أعمال أو أعلى")).toBeVisible();
  });

  test("Gulf customers see AED prices and a USD charge at Kashier's rate", async ({ page }) => {
    await page.goto("/website-builder");
    const wizard = page.locator("#build");
    await wizard.getByRole("radio", { name: "UAE" }).click();
    await expect(wizard.getByText("pay online in USD by Bank cards", { exact: false })).toBeVisible();
    await wizard.getByRole("radio", { name: /Restaurants/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();
    await wizard.getByRole("radio", { name: /Table/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();
    await wizard.getByLabel("Business name").fill("Gulf Table");
    await wizard.getByRole("button", { name: "Continue" }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();
    await expect(wizard.getByText("Prices in AED for UAE.")).toBeVisible();
    await expect(wizard.getByRole("radio", { name: /Business/ })).toContainText("AED");
    await wizard.getByRole("button", { name: "Continue" }).click();
    // Business AED 2,250 setup → AED 1,125 deposit → USD 306.34 at 0.2723.
    await expect(wizard.getByText("You'll be charged about $306.34", { exact: false })).toBeVisible();
    await expect(wizard.getByRole("button", { name: "Continue to payment" })).toBeVisible();
  });

  test("draft survives a reload", async ({ page }) => {
    await page.goto("/website-builder");
    await page.locator("#build").getByRole("radio", { name: "Egypt" }).click();
    await page.locator("#build").getByRole("radio", { name: /Restaurants/ }).click();
    await page.locator("#build").getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#build").getByRole("radio", { name: /Table/ })).toBeVisible();
    await page.evaluate(() => window.location.reload());
    await expect(page.locator("#build").getByRole("radio", { name: /Table/ })).toBeVisible();
  });
});

test.describe("products and galaxy", () => {
  test("Elevora URLs redirect to Polara", async ({ request }) => {
    const res = await request.get("/products/elevora", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toContain("/products/polara");
    const ar = await request.get("/ar/products/elevora", { maxRedirects: 0 });
    expect(ar.headers().location).toContain("/ar/products/polara");
  });

  test("products page lists Polara and Velora", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("region", { name: "Polara" }).getByRole("link")).toHaveAttribute("href", "/products/polara");
    await expect(page.getByRole("region", { name: "Velora" }).getByRole("link")).toHaveAttribute("href", "/products/velora");
  });

  test("galaxy stars are focusable and open a client card", async ({ page, isMobile }) => {
    await page.goto("/work");
    const galaxy = page.locator("section[aria-labelledby='work-galaxy-title']");
    await expect(galaxy.getByRole("heading", { name: "Every client is a star in our galaxy" })).toBeVisible();
    const star = galaxy.getByRole("button", { name: "Delta Clinics, Healthcare" });
    await star.focus();
    await expect(galaxy.getByRole("status")).toContainText("38% fewer no-shows");
    await expect(galaxy.getByRole("link", { name: "Read the case study" })).toHaveAttribute("href", "/work/clinic-portal");
    await expect(galaxy.getByRole("link", { name: "Join our galaxy" })).toHaveAttribute("href", "/website-builder");
    if (isMobile) await expect(galaxy.getByRole("list", { name: "Our clients" })).toBeVisible();
    await galaxy.getByRole("button", { name: "Polara" }).click();
    await expect(galaxy.getByRole("button", { name: "Polara" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Website Builder is in the main navigation", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#mobile-nav").getByRole("link", { name: "Website Builder" }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Website Builder" }).click();
    }
    await expect(page).toHaveURL(/\/website-builder$/);
  });
});
