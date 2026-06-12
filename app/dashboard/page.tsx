"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/dashboard.module.css";
import { getQueue, getAverageDuration, subscribe, type Patient } from "@/app/lib/queue-store";
import { formatEstTime } from "@/app/lib/time";

export default function DashboardPage() {
  const [queue, setQueue] = useState<Patient[]>(getQueue());
  const [avgDuration, setAvgDuration] = useState(getAverageDuration());

  useEffect(() => subscribe(() => {
    setQueue(getQueue());
    setAvgDuration(getAverageDuration());
  }), []);

  const withDoctor = queue.find((p) => p.status === "withDoctor");
  const waiting = queue.filter((p) => p.status === "waiting");

  const greenCount = Math.min(waiting.length, 5);
  const greenPatients = waiting.slice(0, greenCount);
  const redPatients = waiting.slice(greenCount);

  const baseTime = withDoctor?.startedAt;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Queue Dashboard</h1>

      <div className={styles.queue}>
        {withDoctor && (
          <div className={`${styles.tokenCard} ${styles.purple}`}>
            <span className={styles.tokenNumber}>#{withDoctor.tokenNumber}</span>
            <span className={styles.estTime}>With Doctor</span>
          </div>
        )}

        {greenPatients.map((p, i) => (
          <div key={p.id} className={`${styles.tokenCard} ${styles.green}`}>
            <span className={styles.tokenNumber}>#{p.tokenNumber}</span>
            <span className={styles.estTime}>
              ~{formatEstTime(baseTime, i, avgDuration)}
            </span>
          </div>
        ))}

        {redPatients.map((p, i) => (
          <div key={p.id} className={`${styles.tokenCard} ${styles.red}`}>
            <span className={styles.tokenNumber}>#{p.tokenNumber}</span>
            <span className={styles.estTime}>
              ~{formatEstTime(baseTime, greenCount + i, avgDuration)}
            </span>
          </div>
        ))}
      </div>

      {!withDoctor && waiting.length === 0 && (
        <p className={styles.empty}>No patients in queue</p>
      )}
    </div>
  );
}
