"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import styles from "@/styles/login.module.css";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !password.trim()) {
      setError("Please enter both name and password");
      return;
    }

    if (login(name, password)) {
      router.push("/admin");
    } else {
      setError("Invalid name or password");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Queue Care</h1>
        <p className={styles.subtitle}>Receptionist Login</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter your name"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter your password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
