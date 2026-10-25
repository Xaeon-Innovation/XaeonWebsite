import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // One shared test database: run files one after another.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-0123456789-abcdefghijkl",
      API_PUBLIC_URL: "http://api.test",
      APP_URL: "http://app.test",
      BOOKING_NOTIFY_EMAILS: "ops@test.local",
      CORS_ORIGIN: "",
      RESEND_API_KEY: "",
      DISABLE_JOBS: "true",
    },
  },
});
