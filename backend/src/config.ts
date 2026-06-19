// config.ts
// Loads environment variables from .env file and exports them as a typed config object.
// Centralizes all configuration so other files don't access process.env directly.

import dotenv from "dotenv";
import path from "path";

// Load .env from the backend directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS origin - allow the Next.js frontend to call this API
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;

// Validate required config
if (!config.databaseUrl) {
  console.error("FATAL: DATABASE_URL is not set in backend/.env");
  process.exit(1);
}
