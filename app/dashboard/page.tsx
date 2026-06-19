"use client";

import styles from "@/styles/dashboard.module.css";
import { useQueue } from "@/app/lib/use-queue";
import { formatEstTime } from "@/app/lib/time";

export default function DashboardPage() {
  const { patients, avgDuration } = useQueue();

  const withDoctor = patients.find((p) => p.status === "withDoctor") ?? null;
  const waiting = patients.filter((p) => p.status === "waiting");

  const greenCount = Math.min(waiting.length, 5);
  const greenPatients = waiting.slice(0, greenCount);
  const redPatients = waiting.slice(greenCount);

  const baseTime = withDoctor?.started_at
    ? new Date(withDoctor.started_at).getTime()
    : undefined;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Queue Dashboard</h1>

      <div className={styles.queue}>
        {withDoctor && (
          <div className={`${styles.tokenCard} ${styles.purple}`}>
            <span className={styles.tokenNumber}>
              #{withDoctor.token_number}
            </span>
            <span className={styles.estTime}>With Doctor</span>
          </div>
        )}

        {greenPatients.map((p, i) => (
          <div key={p.id} className={`${styles.tokenCard} ${styles.green}`}>
            <span className={styles.tokenNumber}>#{p.token_number}</span>
            <span className={styles.estTime}>
              ~{formatEstTime(baseTime, i, avgDuration)}
            </span>
          </div>
        ))}

        {redPatients.map((p, i) => (
          <div key={p.id} className={`${styles.tokenCard} ${styles.red}`}>
            <span className={styles.tokenNumber}>#{p.token_number}</span>
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
