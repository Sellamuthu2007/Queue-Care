// types/index.ts
// Shared TypeScript interfaces matching the Supabase PostgreSQL table schemas.
// These are used by route handlers for type-safe database operations.

export type PatientStatus = "waiting" | "withDoctor";

/** Represents a row in the `patient` table (active queue). */
export interface Patient {
  id: number;
  name: string;
  token_number: number;
  status: PatientStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/** Represents a row in the `completed_patient` table (historical records). */
export interface CompletedPatient {
  id: number;
  name: string;
  token_number: number;
  started_at: string | null;
  completed_at: string;
  duration_minutes: number | null;
  created_at: string;
}

/** Payload for adding a new patient (POST /api/patients). */
export interface CreatePatientBody {
  name: string;
}

/** Payload for updating a patient's status (PUT /api/patients/:id/status). */
export interface UpdatePatientStatusBody {
  status: PatientStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

/** Response returned by the /api/queue/next endpoint. */
export interface NextPatientResponse {
  movedOut: Patient | null;
  movedIn: Patient | null;
}
