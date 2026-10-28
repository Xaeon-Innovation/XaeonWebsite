import { expect, test, type Page } from "@playwright/test";

const MOCK = "http://127.0.0.1:4010";

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function lastRequest(path: string) {
  const all = (await (await fetch(`${MOCK}/__requests`)).json()) as { path: string; body: Record<string, any> }[];
  return all.filter((r) => r.path === path).at(-1)?.body;
}

test.describe("pages and SEO", () => {
  test("home renders one h1, structured data and no sideways scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Xaeon/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Beyond time.");
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
      els.flatMap((e) => [JSON.parse(e.textContent || "{}")].flat().map((d) => String(d["@type"]))),
    );
    expect(types.join(" ")).toContain("Organization");
    expect(types).toContain("FAQPage");
    await expect(page.getByText("They shipped our portal in six weeks.")).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("arabic pages are right-to-left and link back to English", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /^https?:\/\/[^/]+$/);
    await noHorizontalScroll(page);
  });

  test("old URLs redirect permanently", async ({ request }) => {
    const res = await request.get("/about-us", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toContain("/about");
    const old = await request.get("/case-studies/clinic-portal", { maxRedirects: 0 });
    expect(old.headers().location).toContain("/work/clinic-portal");
  });

  test("unknown pages return 404", async ({ page }) => {
    const res = await page.goto("/definitely-not-here");
    expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("sitemap, robots and llms.txt describe the site", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/blog/how-to-digitise-hr-in-2027</loc>");
    expect(sitemap).toContain("/work/clinic-portal</loc>");
    expect(sitemap).toContain('hreflang="ar"');
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("GPTBot");
    expect(robots).toContain("Disallow: /admin");
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain("Polara");
    expect(llms).toContain("A practical guide to replacing spreadsheets");
  });
});

test.describe("blog", () => {
  test("renders Markdown safely with one h1", async ({ page }) => {
    await page.goto("/blog");
    await page.getByRole("link", { name: /How to digitise HR in 2027/ }).click();
    await expect(page).toHaveURL(/\/blog\/how-to-digitise-hr-in-2027$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".article h2#why-it-matters")).toHaveText("Why it matters");
    await expect(page.locator(".article table")).toBeVisible();
    await expect(page.getByRole("link", { name: "GDPR text" })).toHaveAttribute("target", "_blank");
    // Raw HTML and javascript: links in CMS content must never run.
    expect(await page.locator(".article script").count()).toBe(0);
    const href = await page.getByText("Click me").getAttribute("href");
    expect(href ?? "").not.toContain("javascript");
    expect(await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss)).toBeUndefined();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join(" ")).toContain('"BlogPosting"');
  });

  test("old id-based blog links redirect to the slug", async ({ request }) => {
    const res = await request.get("/blog/how-to-digitise-hr--64b000000000000000000001", { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers().location).toContain("/blog/how-to-digitise-hr-in-2027");
  });
});

test.describe("lead forms", () => {
  test("service enquiry sends attribution and language", async ({ page }) => {
    await page.goto("/services/websites?utm_source=linkedin&utm_medium=social&utm_campaign=e2e");
    await page.locator("#svc-websites-name").fill("Test Person");
    await page.locator("#svc-websites-phone").fill("+20 100 000 0000");
    await page.locator("#svc-websites-email").fill("test@example.com");
    await page.locator("#svc-websites-message").fill("We need a new marketing website.");
    await page.locator('#enquire button[type="submit"]').click();
    await expect(page.getByRole("status")).toContainText("Message sent");
    const body = await lastRequest("/api/v1/system-request/enquiry");
    expect(body?.serviceRequest).toMatchObject({ source: "service", interest: "Websites", locale: "en", website: "" });
    expect(body?.serviceRequest.attribution.utmCampaign).toBe("e2e");
  });

  test("form validation blocks empty submissions", async ({ page }) => {
    await page.goto("/products/polara#demo");
    await page.locator('#demo button[type="submit"]').click();
    await expect(page.locator("#demo [id$='-err']")).toHaveCount(4);
  });

  test("Polara demo request in Arabic", async ({ page }) => {
    await page.goto("/ar/products/polara");
    await page.locator("#polara-name").fill("منى عادل");
    await page.locator("#polara-phone").fill("+20 100 000 0001");
    await page.locator("#polara-email").fill("mona@example.com");
    await page.locator("#polara-teamSize").fill("40");
    await page.locator("#polara-message").fill("نريد استبدال كشوف الحضور الورقية.");
    await page.locator('#demo button[type="submit"]').click();
    await expect(page.locator("#demo [role='status']")).toBeVisible();
    const body = await lastRequest("/api/v1/system-request/enquiry");
    expect(body?.serviceRequest).toMatchObject({ source: "product", interest: "Polara", locale: "ar" });
    expect(body?.serviceRequest.message).toContain("Team size: 40");
  });

  test("book a Google Meet end to end", async ({ page }) => {
    await page.goto("/book");
    await page.locator('button[aria-label$=", Available"]').first().click();
    await page.getByRole("button", { name: /Morning/ }).click();
    await page.getByRole("button", { name: "10:30" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#book-name").fill("Test Person");
    await page.locator("#book-phone").fill("+20 100 000 0000");
    await page.locator("#book-email").fill("test@example.com");
    await page.locator("#book-message").fill("Discuss a new web app.");
    await page.getByRole("button", { name: "Confirm meeting" }).click();
    await expect(page.getByText("You're booked")).toBeVisible();
    const body = await lastRequest("/api/v1/bookings");
    expect(body?.slot).toMatch(/T08:30:00/);
  });
});

test.describe("navigation", () => {
  test("main navigation works on every screen size", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#mobile-nav").getByRole("link", { name: "Services" }).click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" }).click();
    }
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator("h1")).toHaveText("Services built around your product");
  });

  test("language switch keeps the page", async ({ page, isMobile }) => {
    await page.goto("/services/websites");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("link", { name: "Switch to Arabic" }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/ar\/services\/websites$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
