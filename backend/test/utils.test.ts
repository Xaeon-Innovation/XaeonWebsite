import { describe, expect, it } from "vitest";
import { attributionChannel, attributionRows, parseAttribution } from "../src/utils/attribution";
import { slugify } from "../src/controllers/blogPost.controller";
import { serverErrorMessage } from "../src/utils/serverError";

describe("attribution", () => {
  it("cleans, caps and drops unknown fields", () => {
    const a = parseAttribution({ utmSource: " linkedin ", utmMedium: "social", referrer: "x".repeat(999), evil: { $gt: "" } });
    expect(a).toMatchObject({ utmSource: "linkedin", utmMedium: "social" });
    expect(a?.referrer).toHaveLength(300);
    expect(a).not.toHaveProperty("evil");
  });

  it("returns undefined for empty or junk input and ignores future dates", () => {
    expect(parseAttribution({})).toBeUndefined();
    expect(parseAttribution("nope")).toBeUndefined();
    expect(parseAttribution({ firstSeenAt: "2999-01-01" })).toBeUndefined();
  });

  it("labels channels", () => {
    expect(attributionChannel({ utmSource: "google", utmMedium: "cpc" })).toBe("google / cpc");
    expect(attributionChannel({ gclid: "x" })).toBe("google / cpc");
    expect(attributionChannel({ fbclid: "x" })).toBe("facebook / paid-social");
    expect(attributionChannel({ referrer: "https://www.clutch.co/profile/x" })).toBe("Referral: clutch.co");
    expect(attributionChannel(undefined)).toBe("Direct");
    expect(attributionRows({ utmSource: "x", utmCampaign: "launch" })).toContainEqual(["Campaign", "launch"]);
  });
});

describe("blog slugify", () => {
  it("keeps Latin and Arabic, drops accents and symbols", () => {
    expect(slugify("Héllo, World! 2026")).toBe("hello-world-2026");
    expect(slugify("دليل الموارد البشرية")).toBe("دليل-الموارد-البشرية");
    expect(slugify("  --  ")).toBe("");
  });
});

describe("serverErrorMessage", () => {
  it("hides details in production", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(serverErrorMessage(new Error("Mongo exploded"), "Failed")).toBe("Failed");
    process.env.NODE_ENV = prev;
    expect(serverErrorMessage(new Error("Mongo exploded"), "Failed")).toBe("Mongo exploded");
  });
});
