"use client";

import { useState } from "react";
import styles from "@/styles/receptionist.module.css";
import { useQueue } from "@/app/lib/use-queue";
import { formatEstTime } from "@/app/lib/time";
import type { PatientRow } from "@/app/lib/database.types";

export default function AdminPage() {
  const [name, setName] = useState("");
  const { patients, avgDuration, addPatient, nextPatient } = useQueue();
  const [notification, setNotification] = useState<PatientRow | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const patient = await addPatient(name.trim());
    if (patient) setNotification(patient);
    setName("");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNext = () => {
    nextPatient();
  };

  const current = patients.find((p) => p.status === "withDoctor") ?? null;
  const waiting = patients.filter((p) => p.status === "waiting");
  const baseTime = current?.started_at
    ? new Date(current.started_at).getTime()
    : undefined;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Add Patient</h2>
        <div className={styles.addForm}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter patient name"
            className={styles.input}
          />
          <button onClick={handleAdd} className={styles.addBtn}>
            Add Patient
          </button>
        </div>
      </div>

      {current && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>With Doctor</h2>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{current.token_number}</td>
                <td>{current.name}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <button onClick={handleNext} className={styles.nextBtn}>
        Next Patient →
      </button>

      {waiting.length > 0 && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Queue ({waiting.length})</h2>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
                <th>Est. Time</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((p, i) => (
                <tr key={p.id}>
                  <td>{p.token_number}</td>
                  <td>{p.name}</td>
                  <td className={styles.estTimeCell}>
                    ~{formatEstTime(baseTime, i, avgDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {notification && (
        <div className={styles.notification}>
          <p className={styles.notificationText}>
            Patient{" "}
            <span className={styles.notificationBold}>{notification.name}</span>{" "}
            added — Token{" "}
            <span className={styles.notificationBold}>
              #{notification.token_number}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
