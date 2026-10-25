import { afterAll, describe, expect, it } from "vitest";
import { putObject, resetStorageConfig, storageMode } from "../src/services/storage";

/**
 * Runs against a real S3-compatible bucket when TEST_S3_ENDPOINT is set (CI: MinIO service).
 * Expects bucket "xaeon-test" with anonymous read on the endpoint.
 */
const endpoint = process.env.TEST_S3_ENDPOINT;

describe.skipIf(!endpoint)("S3 storage", () => {
  const saved = { ...process.env };
  afterAll(() => {
    process.env = saved;
    resetStorageConfig();
  });

  it("uploads to the bucket and returns a working public URL", async () => {
    Object.assign(process.env, {
      S3_ENDPOINT: endpoint,
      S3_BUCKET: "xaeon-test",
      S3_ACCESS_KEY_ID: process.env.TEST_S3_ACCESS_KEY ?? "minioadmin",
      S3_SECRET_ACCESS_KEY: process.env.TEST_S3_SECRET_KEY ?? "minioadmin",
      S3_PUBLIC_URL: `${endpoint}/xaeon-test`,
      S3_REGION: "us-east-1",
    });
    resetStorageConfig();
    expect(storageMode()).toBe("s3");
    const url = await putObject("site/test-object.txt", Buffer.from("hello"), "text/plain", "http://unused");
    expect(url).toBe(`${endpoint}/xaeon-test/site/test-object.txt`);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("hello");
    expect(res.headers.get("cache-control")).toContain("immutable");
  });
});
