"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "./supabase";
import type {
  PatientRow,
  PatientStatus,
} from "./database.types";

export function useQueue() {
  const supabaseRef = useRef(createClient());
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgDuration, setAvgDuration] = useState(15);

  const fetchQueue = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("patient")
      .select("*")
      .order("token_number", { ascending: true });
    if (data) setPatients(data as PatientRow[]);
    setLoading(false);
  }, []);

  const fetchAvgDuration = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("completed_patient")
      .select("duration_minutes")
      .order("id", { ascending: false })
      .limit(20);
    if (!data || data.length === 0) {
      setAvgDuration(15);
      return;
    }
    const durations = (
      data as { duration_minutes: number | null }[]
    )
      .map((r) => r.duration_minutes)
      .filter((d): d is number => d != null);
    if (durations.length === 0) {
      setAvgDuration(15);
      return;
    }
    const total = durations.reduce((sum, d) => sum + d, 0);
    setAvgDuration(Math.round(total / durations.length));
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchAvgDuration();

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient" },
        () => {
          fetchQueue();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "completed_patient" },
        () => {
          fetchAvgDuration();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueue, fetchAvgDuration]);

  const addPatient = useCallback(async (name: string) => {
    const { data: maxToken } = await supabaseRef.current
      .from("patient")
      .select("token_number")
      .order("token_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tokenNumber = ((maxToken as { token_number: number } | null)?.token_number ?? 0) + 1;

    const { data } = await supabaseRef.current
      .from("patient")
      .insert({
        name,
        token_number: tokenNumber,
        status: "waiting",
        started_at: null,
        completed_at: null,
      } as never)
      .select()
      .single();

    return data as PatientRow | null;
  }, []);

  const nextPatient = useCallback(async () => {
    const { data: current } = await supabaseRef.current
      .from("patient")
      .select("*")
      .eq("status", "withDoctor")
      .single();

    let movedOut: PatientRow | null = null;
    if (current) {
      const duration = current.started_at
        ? Math.round(
            (Date.now() - new Date(current.started_at).getTime()) / 60000,
          )
        : null;

      await supabaseRef.current.from("completed_patient").insert({
        name: current.name,
        token_number: current.token_number,
        started_at: current.started_at,
        completed_at: new Date().toISOString(),
        duration_minutes: duration,
      } as never);

      await supabaseRef.current
        .from("patient")
        .delete()
        .eq("id", current.id);

      movedOut = current;
    }

    const { data: next } = await supabaseRef.current
      .from("patient")
      .select("*")
      .eq("status", "waiting")
      .order("token_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    let movedIn: PatientRow | null = null;
    if (next) {
      const now = new Date().toISOString();
      const updateData: Partial<PatientRow> = {
        status: "withDoctor" as PatientStatus,
        started_at: now,
      };
      await supabaseRef.current
        .from("patient")
        .update(updateData as never)
        .eq("id", next.id);
      movedIn = { ...next, ...updateData } as PatientRow;
    }

    return { movedOut, movedIn };
  }, []);

  return { patients, loading, avgDuration, addPatient, nextPatient };
}
