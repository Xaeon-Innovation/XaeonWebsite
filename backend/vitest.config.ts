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
      // Never let real payment credentials from .env reach the tests (dotenv won't override these).
      PAYMENT_PROVIDERS: "",
      KASHIER_MERCHANT_ID: "",
      KASHIER_API_KEY: "",
      KASHIER_MODE: "test",
      KASHIER_CURRENCIES: "",
      KASHIER_METHODS: "",
      POLAR_ACCESS_TOKEN: "",
      POLAR_WEBHOOK_SECRET: "",
      POLAR_DEPOSIT_PRODUCT_ID: "",
    },
  },
});
