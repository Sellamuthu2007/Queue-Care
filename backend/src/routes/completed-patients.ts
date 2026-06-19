// routes/completed-patients.ts
// Handles read-only operations on the `completed_patient` table.
// Completed patients are historical records of patients who have finished their consultation.

import { Router, Request, Response } from "express";
import pool from "../db/pool";
import type { CompletedPatient } from "../types";

const router = Router();

// ----------------------------------------------------------------
// GET /api/completed-patients
// Returns completed patient records, newest first.
// Supports optional ?limit=N query param (default: 50).
// ----------------------------------------------------------------
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await pool.query<CompletedPatient>(
      "SELECT * FROM completed_patient ORDER BY completed_at DESC LIMIT $1",
      [limit],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[completed-patients] GET error:", err);
    res.status(500).json({ error: "Failed to fetch completed patients" });
  }
});

// ----------------------------------------------------------------
// GET /api/completed-patients/average-duration
// Returns the average consultation duration (in minutes) from the
// last 20 completed patients. Falls back to 15 minutes if no data.
// ----------------------------------------------------------------
router.get("/average-duration", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{ avg: number | null }>(
      `SELECT ROUND(AVG(duration_minutes)) AS avg
       FROM (
         SELECT duration_minutes
         FROM completed_patient
         WHERE duration_minutes IS NOT NULL
         ORDER BY id DESC
         LIMIT 20
       ) recent`,
    );

    const avgDuration = result.rows[0]?.avg ?? 15;
    res.json({ averageDurationMinutes: avgDuration });
  } catch (err) {
    console.error("[completed-patients] GET /average-duration error:", err);
    res.status(500).json({ error: "Failed to calculate average duration" });
  }
});

// ----------------------------------------------------------------
// GET /api/completed-patients/today
// Returns completed patients for today only.
// ----------------------------------------------------------------
router.get("/today", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<CompletedPatient>(
      `SELECT * FROM completed_patient
       WHERE completed_at::date = CURRENT_DATE
       ORDER BY completed_at DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[completed-patients] GET /today error:", err);
    res.status(500).json({ error: "Failed to fetch today's records" });
  }
});

// ----------------------------------------------------------------
// GET /api/completed-patients/stats
// Returns summary statistics for the current day.
// ----------------------------------------------------------------
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{
      total: number;
      avg_duration: number | null;
    }>(
      `SELECT
         COUNT(*)::int AS total,
         ROUND(AVG(duration_minutes))::int AS avg_duration
       FROM completed_patient
       WHERE completed_at::date = CURRENT_DATE`,
    );

    res.json(result.rows[0] || { total: 0, avg_duration: null });
  } catch (err) {
    console.error("[completed-patients] GET /stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
