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
      "Read the [Elevora product page](https://xaeons.com/products/elevora) or the [GDPR text](https://example.org/gdpr).",
      "",
      "<script>window.__xss = true</script>",
      "",
      "[Click me](javascript:window.__xss=true)",
      "",
      "| Tool | Cost |",
      "| --- | --- |",
      "| Elevora | $6/seat |",
    ].join("\n"),
    tags: ["hr", "elevora"],
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
  if (req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ path: url.pathname, body });
      if (url.pathname === "/api/v1/bookings") {
        return send(201, { meeting: { start: body.slot, whenLabel: "Wednesday, 10:30", meetLink: "https://meet.google.com/abc-defg-hij", timezone: "Africa/Cairo" } });
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
