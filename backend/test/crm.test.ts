import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
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

import { adminAgent, app, employee, enquiry } from "./helpers";
import ServiceRequest from "../src/models/serviceRequest.model";
import ProjectType from "../src/models/projectType.model";
import User from "../src/models/user.model";
import { issueInvite } from "../src/services/invite";
import { sendFollowUpDigest } from "../src/jobs/followUpDigest";

let admin: TestAgent;
let ownerId: string;
let leadId: string;

beforeAll(async () => {
  admin = await adminAgent();
  ownerId = String((await employee())._id);
  const res = await request(app)
    .post("/api/v1/system-request/enquiry")
    .send(enquiry({ attribution: { utmSource: "google", utmMedium: "cpc" } }));
  leadId = res.body.id;
  for (let i = 0; i < 3; i += 1) {
    await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ name: `Lead ${i}`, email: `lead${i}@example.com` }));
  }
});

describe("enquiry auto-reply", () => {
  it("emails the visitor in their language", async () => {
    sent.length = 0;
    await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ email: "ar@example.com", locale: "ar" }));
    const reply = sent.find((m) => m.to === "ar@example.com");
    expect(reply?.subject).toContain("وصلتنا رسالتك");
    expect(reply?.html).toContain('dir="rtl"');
  });
});

describe("lead pipeline", () => {
  it("lists, searches and paginates", async () => {
    const page = await admin.get("/api/v1/lead?limit=2&page=1");
    expect(page.body).toMatchObject({ total: 5, pages: 3 });
    const search = await admin.get("/api/v1/lead?q=mona%40example.com");
    expect(search.body.leads[0]).toMatchObject({ channel: "google / cpc", tracked: true });
    expect((await admin.get(`/api/v1/lead?q=${encodeURIComponent("(.*")}`)).body.total).toBe(0);
  });

  it("records every change in the history", async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const res = await admin.patch(`/api/v1/lead/${leadId}`).send({ stage: "qualified", ownerId, followUpAt: yesterday, value: 45000 });
    expect(res.status).toBe(200);
    expect((await admin.patch(`/api/v1/lead/${leadId}`).send({ stage: "bogus" })).status).toBe(400);
    await admin.post(`/api/v1/lead/${leadId}/notes`).send({ text: "Wants a demo." });
    const { body } = await admin.get(`/api/v1/lead/${leadId}`);
    const types = body.lead.activity.map((a: { type: string }) => a.type);
    expect(types).toEqual(expect.arrayContaining(["created", "stage", "owner", "followup", "value", "note"]));
    expect(body.lead.firstResponseAt).toBeTruthy();
    expect(body.lead.owner.name).toBe("Sara Sales");
  });

  it("filters overdue follow-ups and computes stats", async () => {
    expect((await admin.get("/api/v1/lead?followUp=overdue")).body.total).toBe(1);
    const stats = (await admin.get("/api/v1/lead/stats?days=30")).body;
    expect(stats).toMatchObject({ total: 5, overdueFollowUps: 1, pipelineValue: { EGP: 45000 } });
    expect(stats.byStage.qualified).toBe(1);
  });

  it("bulk-updates and exports CSV", async () => {
    const ids = (await admin.get("/api/v1/lead?stage=new")).body.leads.map((l: { _id: string }) => l._id);
    const bulk = await admin.post("/api/v1/lead/bulk").send({ ids, stage: "contacted" });
    expect(bulk.body.updated).toBe(ids.length);
    const csv = await admin.get("/api/v1/lead/export.csv?stage=contacted");
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text.startsWith("﻿")).toBe(true);
    expect(csv.text.trim().split("\r\n")).toHaveLength(ids.length + 1);
  });

  it("neutralises spreadsheet formulas in CSV", async () => {
    await request(app).post("/api/v1/system-request/enquiry").send(enquiry({ name: "=HYPERLINK(\"x\")", email: "f@example.com" }));
    const csv = await admin.get("/api/v1/lead/export.csv?q=f%40example.com");
    expect(csv.text).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it("keeps legacy records editable", async () => {
    const legacy = await ServiceRequest.collection.insertOne({ title: "Old booking", source: "booking", status: "Accepted", stage: "new", activity: [], notes: [] });
    const res = await admin.patch(`/api/v1/lead/${legacy.insertedId}`).send({ stage: "contacted" });
    expect(res.status).toBe(200);
  });

  it("emails a lead and moves it to Contacted", async () => {
    sent.length = 0;
    const lead = await ServiceRequest.create({ source: "contact", title: "x", contactName: "N", contactEmail: "n@example.com", locale: "ar" });
    const res = await admin.post(`/api/v1/lead/${lead._id}/email`).send({ subject: "Hi", body: "Hello\n\nThere" });
    expect(res.status).toBe(200);
    expect(sent[0]).toMatchObject({ to: "n@example.com", subject: "Hi" });
    expect(sent[0].html).toContain('dir="rtl"');
    expect((await ServiceRequest.findById(lead._id))?.stage).toBe("contacted");
  });
});

describe("convert to project + invite", () => {
  it("creates the client, emails an invite and marks the lead won", async () => {
    sent.length = 0;
    const type = await ProjectType.create({ title: "Web App", stages: ["Build"] });
    const res = await admin.post(`/api/v1/lead/${leadId}/convert`).send({ title: "Clinic portal", projectTypeId: String(type._id), managerId: ownerId, deadline: "2027-01-31" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ userCreated: true, inviteSent: true });
    expect(sent.some((m) => m.to === "mona@example.com" && m.html.includes("/set-password?token="))).toBe(true);
    const lead = await ServiceRequest.findById(leadId);
    expect(lead?.stage).toBe("won");
    expect(lead?.followUpAt).toBeNull();
    expect((await admin.post(`/api/v1/lead/${leadId}/convert`).send({ title: "Again", projectTypeId: String(type._id), managerId: ownerId, deadline: "2027-01-31" })).status).toBe(409);
  });

  it("lets the client set a password once, then log in", async () => {
    const user = await User.findOne({ email: "mona@example.com" });
    const token = new URL(await issueInvite(String(user!._id))).searchParams.get("token")!;
    expect((await request(app).post("/api/v1/auth/set-password").send({ token, password: "short" })).status).toBe(400);
    const ok = await request(app).post("/api/v1/auth/set-password").send({ token, password: "ClientPass123" });
    expect(ok.status).toBe(200);
    expect(ok.headers["set-cookie"]?.[0]).toContain("auth_token=");
    expect((await request(app).post("/api/v1/auth/set-password").send({ token, password: "ClientPass123" })).status).toBe(400);
    expect((await request(app).post("/api/v1/auth/login").send({ email: "mona@example.com", password: "ClientPass123" })).status).toBe(200);
  });
});

describe("follow-up digest", () => {
  it("summarises overdue, due and new unassigned leads", async () => {
    sent.length = 0;
    await ServiceRequest.create({ source: "contact", title: "Overdue", contactName: "Late", stage: "qualified", followUpAt: new Date(Date.now() - 3_600_000) });
    const result = await sendFollowUpDigest();
    expect(result.sent).toBe(true);
    expect(result.overdue).toBeGreaterThanOrEqual(1);
    expect(sent[0].to).toEqual(["ops@test.local"]);
    expect(sent[0].html).toContain("/admin/leads?lead=");
  });
});
