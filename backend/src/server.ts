// server.ts
// Main entry point for the Queue Care backend API server.
// Sets up Express with middleware (CORS, JSON parsing) and mounts all route handlers.
// Listens on the port specified in config (default: 4000).

import express from "express";
import cors from "cors";
import { config } from "./config";
import { testConnection } from "./db/pool";
import patientsRouter from "./routes/patients";
import completedPatientsRouter from "./routes/completed-patients";
import queueRouter from "./routes/queue";

const app = express();

// ----------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------

// CORS - allow cross-origin requests from the Next.js frontend
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Parse incoming JSON request bodies
app.use(express.json());

// ----------------------------------------------------------------
// Routes
// ----------------------------------------------------------------

// Health check endpoint (useful for monitoring / deployment)
app.get("/api/health", async (_req, res) => {
  const dbOk = await testConnection();
  res.json({
    status: dbOk ? "healthy" : "degraded",
    database: dbOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
app.use("/api/patients", patientsRouter);
app.use("/api/completed-patients", completedPatientsRouter);
app.use("/api/queue", queueRouter);

// ----------------------------------------------------------------
// 404 handler
// ----------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ----------------------------------------------------------------
// Global error handler
// ----------------------------------------------------------------
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[server] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// ----------------------------------------------------------------
// Start server
// ----------------------------------------------------------------
app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║         Queue Care - API Server          ║
  ║──────────────────────────────────────────║
  ║  Port:     ${String(config.port).padEnd(33)}║
  ║  Env:      ${config.nodeEnv.padEnd(33)}║
  ║  Frontend: ${config.corsOrigin.padEnd(33)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
