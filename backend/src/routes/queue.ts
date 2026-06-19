// routes/queue.ts
// Queue management endpoint: handles the "Next Patient" workflow.
// 1. Moves the current "withDoctor" patient to completed_patient (with duration).
// 2. Promotes the next "waiting" patient to "withDoctor" status.
// This is the core business logic of the queue system.

import { Router, Request, Response } from "express";
import pool from "../db/pool";
import type { Patient, NextPatientResponse } from "../types";

const router = Router();

// ----------------------------------------------------------------
// POST /api/queue/next
// Advances the queue: completes the current patient and brings in the next.
// Returns { movedOut: Patient | null, movedIn: Patient | null }
// ----------------------------------------------------------------
router.post("/next", async (_req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    // Use a transaction to ensure both operations succeed or fail together
    await client.query("BEGIN");

    // Step 1: Find the patient currently with the doctor
    const currentResult = await client.query<Patient>(
      "SELECT * FROM patient WHERE status = 'withDoctor' LIMIT 1",
    );
    const currentPatient = currentResult.rows[0] || null;

    let movedOut: Patient | null = null;

    if (currentPatient) {
      // Calculate consultation duration in minutes
      const duration = currentPatient.started_at
        ? Math.round(
            (Date.now() - new Date(currentPatient.started_at).getTime()) / 60000,
          )
        : null;

      // Insert into completed_patient table
      await client.query(
        `INSERT INTO completed_patient (name, token_number, started_at, completed_at, duration_minutes)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [
          currentPatient.name,
          currentPatient.token_number,
          currentPatient.started_at,
          duration,
        ],
      );

      // Delete from active patient table
      await client.query("DELETE FROM patient WHERE id = $1", [
        currentPatient.id,
      ]);

      movedOut = currentPatient;
    }

    // Step 2: Find the next waiting patient (lowest token number)
    const nextResult = await client.query<Patient>(
      "SELECT * FROM patient WHERE status = 'waiting' ORDER BY token_number ASC LIMIT 1",
    );
    const nextPatient = nextResult.rows[0] || null;

    let movedIn: Patient | null = null;

    if (nextPatient) {
      const now = new Date().toISOString();
      const updateResult = await client.query<Patient>(
        `UPDATE patient SET status = 'withDoctor', started_at = $1 WHERE id = $2 RETURNING *`,
        [now, nextPatient.id],
      );
      movedIn = updateResult.rows[0] || null;
    }

    // Commit the transaction
    await client.query("COMMIT");

    const response: NextPatientResponse = { movedOut, movedIn };
    res.json(response);
  } catch (err) {
    // Rollback on any error
    await client.query("ROLLBACK");
    console.error("[queue] POST /next error:", err);
    res.status(500).json({ error: "Failed to advance queue" });
  } finally {
    // Release the connection back to the pool
    client.release();
  }
});

// ----------------------------------------------------------------
// GET /api/queue/status
// Returns a snapshot of the current queue state.
// ----------------------------------------------------------------
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const [waitingResult, withDoctorResult, completedTodayResult] =
      await Promise.all([
        pool.query<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM patient WHERE status = 'waiting'",
        ),
        pool.query<Patient>(
          "SELECT * FROM patient WHERE status = 'withDoctor' LIMIT 1",
        ),
        pool.query<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM completed_patient WHERE completed_at::date = CURRENT_DATE",
        ),
      ]);

    res.json({
      waitingCount: waitingResult.rows[0]?.count ?? 0,
      currentPatient: withDoctorResult.rows[0] || null,
      completedToday: completedTodayResult.rows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("[queue] GET /status error:", err);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
});

export default router;
