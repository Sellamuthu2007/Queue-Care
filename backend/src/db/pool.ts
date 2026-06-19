// pool.ts
// Creates a PostgreSQL connection pool using the pg library.
// The pool is shared across the entire application for efficient database access.
// Uses the DATABASE_URL from config to connect to Supabase PostgreSQL.

import { Pool } from "pg";
import { config } from "../config";

// Create a new pool with the connection string from .env
export const pool = new Pool({
  connectionString: config.databaseUrl,

  // Connection pool settings
  max: 20,               // Maximum 20 concurrent connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Fail if cannot connect within 5s
});

// Test the connection on startup
pool.on("connect", () => {
  console.log("[DB] Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

// Quick health-check function
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

export default pool;
