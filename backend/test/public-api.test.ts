import request from "supertest";
import { describe, expect, it } from "vitest";
import { adminAgent, app, enquiry } from "./helpers";
import ServiceRequest from "../src/models/serviceRequest.model";
import Package from "../src/models/package.model";
import User from "../src/models/user.model";

describe("platform", () => {
  it("serves /health with security headers and JSON 404s", async () => {
    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.headers["x-content-type-options"]).toBe("nosniff");
    expect(health.headers["x-powered-by"]).toBeUndefined();
    const missing = await request(app).get("/nope");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: "Not found" });
  });
});

describe("public enquiries", () => {
  it("stores a lead with attribution, language and a 'created' history entry", async () => {
    const res = await request(app)
      .post("/api/v1/system-request/enquiry")
      .send(enquiry({ source: "product", interest: "Elevora", locale: "ar", attribution: { utmSource: "linkedin", utmCampaign: "launch" } }));
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(["id", "message"]);
    const lead = await ServiceRequest.findById(res.body.id);
    expect(lead).toMatchObject({ source: "product", stage: "new", locale: "ar", title: "Product demo: Elevora", contactKey: "mona@example.com" });
    expect(lead?.attribution?.utmCampaign).toBe("launch");
    expect(lead?.activity[0]?.type).toBe("created");
  });

  it("silently drops honeypot submissions", async () => {
    const before = await ServiceRequest.countDocuments();
    const res = await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ website: "spam.example" }));
    expect(res.status).toBe(201);
    expect(await ServiceRequest.countDocuments()).toBe(before);
  });

  it("rejects bad input", async () => {
    expect((await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ source: "admin" }))).status).toBe(400);
    expect((await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ email: "" }))).status).toBe(400);
  });
});

describe("packages visibility", () => {
  it("hides unpublished packages from visitors but not admins", async () => {
    await Package.create([
      { title: "Visible", showOnWebsite: true },
      { title: "Hidden", showOnWebsite: false },
    ]);
    const pub = await request(app).get("/api/v1/package");
    expect(pub.body.packages.map((p: { title: string }) => p.title)).toEqual(["Visible"]);
    const hidden = await Package.findOne({ title: "Hidden" });
    expect((await request(app).get(`/api/v1/package/${hidden!._id}`)).status).toBe(404);
    const admin = await adminAgent();
    expect((await admin.get("/api/v1/package")).body.packages).toHaveLength(2);
  });
});

describe("accounts", () => {
  it("never returns password hashes", async () => {
    const admin = await adminAgent();
    const res = await admin.get("/api/v1/user");
    expect(res.status).toBe(200);
    for (const u of res.body.users) {
      expect(u).not.toHaveProperty("password");
      expect(u).not.toHaveProperty("inviteTokenHash");
    }
  });

  it("rejects wrong passwords and anonymous admin access", async () => {
    await User.create({ email: "c@test.local", password: "x", first_name: "C", last_name: "D", name: "C D", phone_number: "0" });
    expect((await request(app).post("/api/v1/auth/login").send({ email: "c@test.local", password: "wrong" })).status).toBe(401);
    expect((await request(app).get("/api/v1/lead")).status).toBe(401);
  });

  it("rate-limits login attempts", async () => {
    process.env.TEST_RATE_LIMIT = "1";
    try {
      const codes: number[] = [];
      for (let i = 0; i < 11; i += 1) {
        codes.push((await request(app).post("/api/v1/auth/login").send({ email: "nobody@test.local", password: "x" })).status);
      }
      expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
      expect(codes[10]).toBe(429);
    } finally {
      delete process.env.TEST_RATE_LIMIT;
    }
  });
});
