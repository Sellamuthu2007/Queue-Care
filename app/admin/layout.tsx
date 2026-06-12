"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import styles from "@/styles/admin-layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Queue Care</h1>
        <div className={styles.userArea}>
          <span className={styles.userName}>{user}</span>
          <button
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
            className={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
