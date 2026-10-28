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
      window.localStorage.removeItem("xaeon-builder-draft-v2");
      window.sessionStorage.setItem("e2e-draft-cleared", "1");
    });
  });

  async function chooseCountry(wizard: import("@playwright/test").Locator, name: string) {
    const box = wizard.getByRole("combobox");
    await box.click();
    await box.fill(name);
    await wizard.getByRole("option", { name: new RegExp(name) }).first().click();
  }

  test("landing renders one h1, plans without prices, cross-sells and no sideways scroll", async ({ page }) => {
    await page.goto("/website-builder");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Choose a proven website");
    const plans = page.locator("section[aria-labelledby='plans-title']");
    await expect(plans.getByRole("heading", { name: "Simple plans" })).toBeVisible();
    await expect(plans).not.toContainText("EGP");
    await expect(plans.getByRole("link", { name: "Get my price" })).toBeVisible();
    await expect(page.getByText("Save 15%").first()).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("full order: business → design → pages → brand → features → proposal", async ({ page }) => {
    await page.goto("/website-builder?utm_source=google&utm_campaign=builder-e2e");
    const wizard = page.locator("#build");

    // Validation blocks an empty first step.
    await wizard.getByRole("button", { name: "Continue" }).click();
    await expect(wizard.getByText("Choose your country.")).toBeVisible();
    await expect(wizard.getByText("Enter your business name.")).toBeVisible();
    await expect(wizard.getByText("Choose your business type.")).toBeVisible();

    // No prices or currency anywhere before the proposal.
    await chooseCountry(wizard, "Egypt");
    await expect(wizard.getByRole("combobox")).toHaveValue("Egypt");
    await wizard.getByLabel("Business name").fill("Delta Clinics");
    await wizard.getByRole("radio", { name: /Clinics & healthcare/ }).click();
    await wizard.getByRole("button", { name: "Take bookings" }).click();
    await expect(wizard).not.toContainText("EGP");
    await wizard.getByRole("button", { name: "Continue" }).click();

    await expect(wizard.getByRole("heading", { name: "Pick a design" })).toBeFocused();
    await expect(wizard.getByRole("radio", { name: /Clinic Care/ })).toContainText("Best for your goal");
    await wizard.getByRole("button", { name: "Dark" }).click();
    await expect(wizard.getByRole("radio", { name: /Clinic Care/ })).toHaveCount(0);
    await wizard.getByRole("button", { name: "All" }).click();
    await wizard.getByRole("radio", { name: /Clinic Care/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();

    // Pages: template defaults are pre-selected; the preview can show each one.
    await expect(wizard.getByText("5 pages selected")).toBeVisible();
    await expect(wizard.getByRole("checkbox", { name: /Home/ })).toBeDisabled();
    await wizard.getByRole("group", { name: "Preview pages" }).getByRole("button", { name: "Doctors" }).click();
    await expect(wizard.getByRole("group", { name: "Preview pages" }).getByRole("button", { name: "Doctors" })).toHaveAttribute("aria-pressed", "true");
    await wizard.getByRole("button", { name: "Continue" }).click();

    await wizard.getByRole("button", { name: "Dark" }).click();
    await expect(wizard.getByText("© Delta Clinics")).toBeAttached(); // live preview
    await wizard.getByRole("button", { name: "Continue" }).click();

    await expect(wizard.getByRole("checkbox", { name: /Online booking/ })).toBeChecked();
    await wizard.getByText("Mobile app for your website").click();
    await expect(wizard).not.toContainText("EGP");
    await wizard.getByRole("button", { name: "See my proposal" }).click();

    // Proposal: no premature validation errors; price revealed in EGP; best-value plan for 5 pages + booking + app.
    await expect(wizard.getByText("Please enter your name.")).toHaveCount(0);
    await expect(wizard.getByRole("link", { name: "privacy policy" })).toHaveAttribute("href", "/privacy");
    await expect(wizard.getByText("Prices in EGP for Egypt.")).toBeVisible();
    await expect(wizard.getByRole("radio", { name: /Launch/ })).toHaveAttribute("aria-checked", "true");
    await expect(wizard.getByRole("radio", { name: /Launch/ })).toContainText("Best value for you");
    await expect(wizard.getByRole("radio", { name: /Launch/ })).toContainText("4 extra pages");
    await wizard.getByRole("button", { name: "Annual (2 months free)" }).click();
    await wizard.getByRole("button", { name: /Pay EGP\s?14,000 deposit and reserve/ }).click();
    await expect(wizard.getByText("Please accept the terms to continue.")).toBeVisible();
    await wizard.getByLabel("Full name").fill("Mona Adel");
    await wizard.getByLabel("Email").fill("mona@example.com");
    await wizard.getByLabel("Phone / WhatsApp").fill("+20 100 000 0001");
    await wizard.getByRole("checkbox", { name: /I agree/ }).check();
    await wizard.getByRole("button", { name: /Pay EGP\s?14,000 deposit and reserve/ }).click();

    await expect(page).toHaveURL(/\/website-builder\/success\?ref=XB-TEST01&token=tok/);
    await expect(page.locator("h1")).toHaveText("Welcome to our galaxy");

    const body = await lastRequest("/api/v1/builder/orders");
    expect(body?.order).toMatchObject({
      country: "EG",
      payNow: true,
      locale: "en",
      config: { category: "clinics", goal: "bookings", templateSlug: "clinic-care", pages: ["home", "services", "team", "booking", "contact"], planTier: "launch", billing: "annual" },
      brand: { businessName: "Delta Clinics", mode: "dark" },
      contact: { name: "Mona Adel", email: "mona@example.com" },
    });
    expect(body?.order.config.addonKeys).toEqual(expect.arrayContaining(["booking", "mobile-app"]));
    expect(body?.order.attribution.utmCampaign).toBe("builder-e2e");
    expect(body?.website).toBe("");
  });

  test("Gulf customer: AED proposal, USD charge, and 'send without paying'", async ({ page }) => {
    await page.goto("/website-builder");
    const wizard = page.locator("#build");
    await chooseCountry(wizard, "United Arab Emirates");
    await wizard.getByLabel("Business name").fill("Gulf Table");
    await wizard.getByRole("radio", { name: /Restaurants/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();
    await wizard.getByRole("radio", { name: /Table/ }).click();
    for (let i = 0; i < 3; i += 1) await wizard.getByRole("button", { name: "Continue" }).click();
    await wizard.getByRole("button", { name: "See my proposal" }).click();
    await expect(wizard.getByText("Prices in AED for United Arab Emirates.")).toBeVisible();
    // Launch AED 950 + 2 extra pages × 140 = 1,230 deposit → USD 334.93 at 0.2723.
    await expect(wizard.getByText("You'll be charged about $334.93", { exact: false })).toBeVisible();
    await wizard.getByLabel("Full name").fill("Ali Hassan");
    await wizard.getByLabel("Email").fill("ali@example.com");
    await wizard.getByLabel("Phone / WhatsApp").fill("+971 50 000 0000");
    await wizard.getByRole("checkbox", { name: /I agree/ }).check();
    await wizard.getByRole("button", { name: "Send without paying now" }).click();
    await expect(page).toHaveURL(/\/website-builder\/success/);
    const body = await lastRequest("/api/v1/builder/orders");
    expect(body?.order).toMatchObject({ country: "AE", payNow: false, config: { templateSlug: "table", pages: ["home", "menu", "contact"] } });
  });

  test("category deep link from Velora, in Arabic, with Arabic country search", async ({ page }) => {
    await page.goto("/ar/products/velora");
    await expect(page.locator("h1")).toHaveCount(1);
    await page.getByRole("link", { name: "اربطه بموقع إلكتروني" }).click();
    await expect(page).toHaveURL(/\/ar\/website-builder\?category=clinics/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const wizard = page.locator("#build");
    await expect(wizard.getByRole("radio", { name: /العيادات والرعاية الصحية/ })).toHaveAttribute("aria-checked", "true");
    await chooseCountry(wizard, "السعودية");
    await wizard.getByLabel("اسم النشاط").fill("عيادات دلتا");
    await wizard.getByRole("button", { name: "متابعة" }).click();
    await expect(wizard.getByRole("heading", { name: "اختر تصميمًا" })).toBeVisible();
  });

  test("draft survives a reload", async ({ page }) => {
    await page.goto("/website-builder");
    const wizard = page.locator("#build");
    await chooseCountry(wizard, "Egypt");
    await wizard.getByLabel("Business name").fill("Nile Bites");
    await wizard.getByRole("radio", { name: /Restaurants/ }).click();
    await wizard.getByRole("button", { name: "Continue" }).click();
    await expect(wizard.getByRole("radio", { name: /Table/ })).toBeVisible();
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
