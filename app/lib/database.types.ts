export type PatientStatus = "waiting" | "withDoctor";

export interface PatientRow {
  id: number;
  name: string;
  token_number: number;
  status: PatientStatus;
  started_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PatientInsert {
  name: string;
  token_number: number;
  status: PatientStatus;
  started_at: string | null;
  completed_at: string | null;
}

export interface PatientUpdate {
  name?: string;
  token_number?: number;
  status?: PatientStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CompletedPatientRow {
  id: number;
  name: string;
  token_number: number;
  started_at: string | null;
  completed_at: string;
  duration_minutes: number | null;
  created_at: string;
}

export interface CompletedPatientInsert {
  name: string;
  token_number: number;
  started_at: string | null;
  completed_at: string;
  duration_minutes: number | null;
}

export interface Database {
  public: {
    Tables: {
      patient: {
        Row: PatientRow;
        Insert: PatientInsert;
        Update: PatientUpdate;
      };
      completed_patient: {
        Row: CompletedPatientRow;
        Insert: CompletedPatientInsert;
        Update: Record<string, never>;
      };
    };
  };
}
