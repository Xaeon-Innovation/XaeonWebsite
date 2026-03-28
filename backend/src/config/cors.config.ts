import type { CorsOptions } from "cors";

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header): curl, Postman, server-to-server.
    if (!origin) return callback(null, true);

    // If CORS_ORIGIN isn't configured, default to allowing requests.
    // (In dev with Vite proxy, CORS typically isn't exercised anyway.)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

