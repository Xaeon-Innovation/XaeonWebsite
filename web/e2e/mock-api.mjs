/**
 * Hermetic stand-in for the Express API used by the E2E tests (and the e2e build).
 * GET endpoints return fixtures; POSTs are recorded and readable at GET /__requests.
 * Never talks to production.
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT || 4010);
const now = Date.now();
const iso = (days) => new Date(now + days * 86_400_000).toISOString();
const requests = [];

const author = { _id: "a1", name: "Nour Writer" };
const posts = [
  {
    _id: "64b000000000000000000001",
    title: "How to digitise HR in 2027",
    slug: "how-to-digitise-hr-in-2027",
    excerpt: "A practical guide to replacing spreadsheets with a real HR system.",
    content: [
      "Spreadsheets break when a team grows past a few dozen people.",
      "",
      "# Why it matters",
      "",
      "Read the [Polara product page](https://xaeons.com/products/polara) or the [GDPR text](https://example.org/gdpr).",
      "",
      "<script>window.__xss = true</script>",
      "",
      "[Click me](javascript:window.__xss=true)",
      "",
      "| Tool | Cost |",
      "| --- | --- |",
      "| Polara | $6/seat |",
    ].join("\n"),
    tags: ["hr", "polara"],
    status: "published",
    publishedAt: iso(-3),
    createdAt: iso(-3),
    updatedAt: iso(-1),
    author,
  },
];
const caseStudy = {
  _id: "c1",
  slug: "clinic-portal",
  label: "Healthcare",
  value: "1",
  title: "Clinic patient portal",
  subtitle: "Healthcare · Web app",
  description: "A booking and records portal for a chain of clinics.",
  imageUrl: "/logo.webp",
  stats: [{ value: "38%", label: "fewer no-shows" }],
  introText: "Patients booked by phone and half the calls went unanswered.",
  createdAt: iso(-30),
  updatedAt: iso(-2),
};


const L = (en, ar) => ({ en, ar });
const P = (egp, aed, usd) => ({ EGP: { setup: egp[0], monthly: egp[1] }, AED: { setup: aed[0], monthly: aed[1] }, USD: { setup: usd[0], monthly: usd[1] } });
const builderCatalog = {
  templates: [
    { slug: "clinic-care", category: "clinics", layout: "classic", hero: "split", mode: "light", corners: "soft", name: L("Clinic Care", "Clinic Care"), tagline: L("Calm, booking-first.", "هادئ والحجز أولًا."), defaultBrand: { primary: "#1b7f79", accent: "#0f2f3a", font: "modern" }, pageKeys: ["home", "about", "services", "team", "booking", "faq", "contact"], defaultPages: ["home", "services", "team", "booking", "contact"], tags: [L("Classic", "كلاسيكي"), L("Light", "فاتح")], goals: ["bookings", "calls"], features: [], recommendedAddons: ["booking"], minPlan: "launch" },
    { slug: "vita-dark", category: "clinics", layout: "classic", hero: "split", mode: "dark", corners: "soft", name: L("Vita", "Vita"), tagline: L("Premium and modern.", "فاخر وعصري."), defaultBrand: { primary: "#22d3ee", accent: "#0b1220", font: "display" }, pageKeys: ["home", "services", "gallery", "booking", "contact"], defaultPages: ["home", "services", "contact"], tags: [L("Classic", "كلاسيكي"), L("Dark", "داكن")], goals: ["leads"], features: [], recommendedAddons: [], minPlan: "launch" },
    { slug: "medica-plus", category: "clinics", layout: "bold", hero: "banner", mode: "light", corners: "sharp", name: L("Medica Plus", "Medica Plus"), tagline: L("Multi-specialty.", "متعدد التخصصات."), defaultBrand: { primary: "#0e9f6e", accent: "#062a20", font: "modern" }, pageKeys: ["home", "about", "services", "team", "booking", "contact"], defaultPages: ["home", "services", "contact"], tags: [L("Bold", "جريء"), L("Light", "فاتح")], goals: ["bookings"], features: [], recommendedAddons: [], minPlan: "business" },
    { slug: "table", category: "restaurants", layout: "minimal", hero: "centered", mode: "light", corners: "round", name: L("Table", "Table"), tagline: L("Menus.", "القوائم."), defaultBrand: { primary: "#b45309", accent: "#1c1917", font: "serif" }, pageKeys: ["home", "menu", "about", "gallery", "booking", "contact"], defaultPages: ["home", "menu", "contact"], tags: [L("Minimal", "بسيط"), L("Light", "فاتح")], goals: ["bookings"], features: [], recommendedAddons: [], minPlan: "launch" },
  ],
  addons: [
    { key: "booking", kind: "module", name: L("Online booking", "الحجز الإلكتروني"), description: L("Book from your site.", "احجز من موقعك."), icon: "calendar", prices: P([2500, 0], [350, 0], [95, 0]), quoted: false, discountPercent: 0, includedIn: ["growth"], categories: ["clinics"] },
    { key: "mobile-app", kind: "service", name: L("Mobile app for your website", "تطبيق جوال لموقعك"), description: L("iOS & Android.", "iOS وAndroid."), icon: "smartphone", prices: P([60000, 0], [9000, 0], [2400, 0]), quoted: true, discountPercent: 15, badge: L("Save 15% with your website", "وفّر 15% مع موقعك"), includedIn: [], categories: [] },
  ],
  plans: [
    { tier: "launch", name: L("Launch", "انطلاق"), summary: L("One page.", "صفحة واحدة."), prices: P([7500, 650], [950, 75], [275, 21]), includedPages: 1, extraPagePrice: { EGP: 1000, AED: 140, USD: 40 }, quoted: false, features: [L("One-page site", "موقع صفحة واحدة")], highlighted: false },
    { tier: "business", name: L("Business", "أعمال"), summary: L("Five pages.", "خمس صفحات."), prices: P([16500, 1550], [2250, 185], [625, 51]), includedPages: 5, extraPagePrice: { EGP: 1000, AED: 140, USD: 40 }, quoted: false, features: [L("Up to 5 pages", "حتى 5 صفحات")], highlighted: true },
  ],
};
// Kashier charges EGP and USD; Gulf (AED) deposits are converted to USD at Kashier's rate.
builderCatalog.payments = {
  EGP: { online: true, provider: "kashier", methods: ["card", "wallet"] },
  AED: { online: true, provider: "kashier", methods: ["card"], chargeCurrency: "USD", rate: 0.2723 },
  USD: { online: true, provider: "kashier", methods: ["card"] },
};
const stars = [
  { _id: "s1", name: "Delta Clinics", industry: "Healthcare", product: "velora", magnitude: 3, highlight: "38% fewer no-shows", caseStudy: { slug: "clinic-portal", title: "Clinic patient portal" } },
  { _id: "s2", name: "Nile Academy", industry: "Education", product: "website", magnitude: 2 },
  { _id: "s3", name: "Atlas Logistics", industry: "Logistics", product: "polara", magnitude: 1 },
];

const routes = {
  "/api/v1/package": () => ({
    packages: [
      { _id: "6a0000000000000000000001", title: "Launch Ready", description: "Website + brand essentials.", discount: 12, showOnWebsite: true, sortOrder: 1, project_type: [{ _id: "t1", title: "Websites", stages: ["Discovery", "Build", "Launch"] }] },
    ],
  }),
  "/api/v1/site/case-studies": () => ({ slides: [{ id: "c1", slug: "clinic-portal", imageSrc: caseStudy.imageUrl, title: caseStudy.title, subtitle: caseStudy.subtitle, description: caseStudy.description }] }),
  "/api/v1/site/case-studies/clinic-portal": () => ({ caseStudy }),
  "/api/v1/blog-post": () => ({ blogPosts: posts }),
  "/api/v1/blog-post/slug/how-to-digitise-hr-in-2027": () => ({ blogPost: posts[0] }),
  "/api/v1/blog-post/64b000000000000000000001": () => ({ blogPost: posts[0] }),
  "/api/v1/site/team-members": () => ({ teamMembers: [], showSection: true }),
  "/api/v1/site/testimonials": () => ({ testimonials: [{ _id: "q1", quote: "They shipped our portal in six weeks.", name: "Dr. Hana", role: "Director", company: "Delta Clinics" }] }),
  "/api/v1/builder/catalog": () => builderCatalog,
  "/api/v1/site/stars": () => ({ stars }),
  "/api/v1/site/social-links": () => ({ socialLinks: { linkedinUrl: "https://www.linkedin.com/company/xaeon", facebookUrl: "", instagramUrl: "", twitterUrl: "", emailUrl: "" } }),
  "/api/v1/bookings/availability": () => {
    const day = new Date(now + 2 * 86_400_000);
    const ymd = day.toISOString().slice(0, 10);
    return {
      open: true,
      reason: null,
      timezone: "Africa/Cairo",
      slotMinutes: 30,
      horizonDays: 30,
      month: ymd.slice(0, 7),
      dates: { [ymd]: [{ start: `${ymd}T08:00:00.000Z`, label: "10:00" }, { start: `${ymd}T08:30:00.000Z`, label: "10:30" }] },
    };
  },
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method === "GET" && url.pathname === "/__requests") return send(200, requests);
  if (req.method === "POST" && url.pathname === "/api/v1/builder/assets") {
    req.resume();
    requests.push({ path: url.pathname, body: {} });
    return send(200, { url: "http://127.0.0.1:3100/logo.webp" });
  }
  if (req.method === "GET" && /^\/api\/v1\/builder\/orders\/[^/]+\/status$/.test(url.pathname)) {
    const ref = url.pathname.split("/")[5];
    if (url.searchParams.get("token") !== "tok") return send(404, { error: "Order not found" });
    return send(200, { ref, status: "submitted", paymentStatus: "none", businessName: "Delta Clinics", deposit: 8250, currency: "EGP" });
  }
  if (req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ path: url.pathname, body });
      if (url.pathname === "/api/v1/bookings") {
        return send(201, { meeting: { start: body.slot, whenLabel: "Wednesday, 10:30", meetLink: "https://meet.google.com/abc-defg-hij", timezone: "Africa/Cairo" } });
      }
      if (url.pathname === "/api/v1/builder/orders") {
        return send(201, { ref: "XB-TEST01", token: "tok", status: "submitted", quote: {} });
      }
      return send(201, { message: "ok", id: "x" });
    });
    return;
  }
  const handler = routes[url.pathname];
  if (handler) return send(200, handler());
  return send(404, { error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock API on http://127.0.0.1:${PORT}`));
