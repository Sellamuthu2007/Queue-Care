// routes/patients.ts
// Handles CRUD operations on the `patient` table (active queue).
// Provides endpoints to list, add, update status, and remove patients.

import { Router, Request, Response } from "express";
import pool from "../db/pool";
import type { Patient, PatientStatus, CreatePatientBody } from "../types";

const router = Router();

// ----------------------------------------------------------------
// GET /api/patients
// Returns all patients in the queue, ordered by token_number ascending.
// ----------------------------------------------------------------
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<Patient>(
      "SELECT * FROM patient ORDER BY token_number ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[patients] GET error:", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ----------------------------------------------------------------
// GET /api/patients/waiting
// Returns only waiting patients (not yet with the doctor).
// ----------------------------------------------------------------
router.get("/waiting", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<Patient>(
      "SELECT * FROM patient WHERE status = 'waiting' ORDER BY token_number ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[patients] GET /waiting error:", err);
    res.status(500).json({ error: "Failed to fetch waiting patients" });
  }
});

// ----------------------------------------------------------------
// GET /api/patients/with-doctor
// Returns the patient currently with the doctor (if any).
// ----------------------------------------------------------------
router.get("/with-doctor", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<Patient>(
      "SELECT * FROM patient WHERE status = 'withDoctor' LIMIT 1",
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("[patients] GET /with-doctor error:", err);
    res.status(500).json({ error: "Failed to fetch current patient" });
  }
});

// ----------------------------------------------------------------
// POST /api/patients
// Adds a new patient to the queue.
// Auto-assigns the next token number (max existing + 1).
// Body: { name: string }
// ----------------------------------------------------------------
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body as CreatePatientBody;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Patient name is required" });
      return;
    }

    // Get the highest token number to auto-increment
    const maxTokenResult = await pool.query<{ max: number | null }>(
      "SELECT MAX(token_number) AS max FROM patient",
    );
    const tokenNumber = (maxTokenResult.rows[0]?.max ?? 0) + 1;

    const result = await pool.query<Patient>(
      `INSERT INTO patient (name, token_number, status, started_at, completed_at)
       VALUES ($1, $2, 'waiting', NULL, NULL)
       RETURNING *`,
      [name.trim(), tokenNumber],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[patients] POST error:", err);
    res.status(500).json({ error: "Failed to add patient" });
  }
});

// ----------------------------------------------------------------
// PUT /api/patients/:id/status
// Updates a patient's status (e.g., waiting -> withDoctor).
// Body: { status: "waiting" | "withDoctor", started_at?: string, completed_at?: string }
// ----------------------------------------------------------------
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const { status, started_at, completed_at } = req.body;

    const allowedStatuses: PatientStatus[] = ["waiting", "withDoctor"];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
      return;
    }

    const result = await pool.query<Patient>(
      `UPDATE patient
       SET status = $1,
           started_at = COALESCE($2, started_at),
           completed_at = COALESCE($3, completed_at)
       WHERE id = $4
       RETURNING *`,
      [status, started_at ?? null, completed_at ?? null, id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[patients] PUT /:id/status error:", err);
    res.status(500).json({ error: "Failed to update patient status" });
  }
});

// ----------------------------------------------------------------
// DELETE /api/patients/:id
// Removes a patient from the queue (used when they leave or are moved to completed).
// ----------------------------------------------------------------
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid patient ID" });
      return;
    }

    const result = await pool.query<Patient>(
      "DELETE FROM patient WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    res.json({ message: "Patient removed", patient: result.rows[0] });
  } catch (err) {
    console.error("[patients] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

export default router;
