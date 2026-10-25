import mongoose from "mongoose";
import { afterAll, beforeAll } from "vitest";

/**
 * Every test file gets a clean database. Point TEST_DB_URI at a throwaway MongoDB
 * (CI uses a service container; locally: docker run -p 27017:27017 mongo:7).
 */
beforeAll(async () => {
  const uri = process.env.TEST_DB_URI;
  if (!uri) throw new Error("Set TEST_DB_URI to a disposable MongoDB database (never production).");
  if (!/test/i.test(new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).pathname)) {
    throw new Error("TEST_DB_URI's database name must contain 'test' (safety check).");
  }
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  // Unique indexes (slug, email…) must exist for the duplicate-handling tests.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
});

afterAll(async () => {
  await mongoose.disconnect();
});
