"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/receptionist.module.css";
import { getQueue, getAverageDuration, addPatient, nextPatient, subscribe, type Patient } from "@/app/lib/queue-store";
import { formatEstTime } from "@/app/lib/time";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [patients, setPatients] = useState<Patient[]>(getQueue());
  const [avgDuration, setAvgDuration] = useState(getAverageDuration());
  const [notification, setNotification] = useState<Patient | null>(null);

  useEffect(() => subscribe(() => {
    setPatients(getQueue());
    setAvgDuration(getAverageDuration());
  }), []);

  const handleAdd = () => {
    if (!name.trim()) return;
    const patient = addPatient(name.trim());
    setNotification(patient);
    setName("");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNext = () => {
    nextPatient();
  };

  const current = patients.find((p) => p.status === "withDoctor");
  const waiting = patients.filter((p) => p.status === "waiting");
  const baseTime = current?.startedAt;

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
                <td>{current.tokenNumber}</td>
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
          <h2 className={styles.panelTitle}>
            Queue ({waiting.length})
          </h2>
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
                  <td>{p.tokenNumber}</td>
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
            Patient <span className={styles.notificationBold}>{notification.name}</span> added — Token{" "}
            <span className={styles.notificationBold}>#{notification.tokenNumber}</span>
          </p>
        </div>
      )}
    </div>
  );
}
