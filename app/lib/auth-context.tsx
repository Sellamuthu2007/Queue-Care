"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  user: string | null;
  login: (name: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_USER = "Sellamuthu";
const VALID_PASS = "123";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("queue-care-user");
    }
    return null;
  });

  const login = (name: string, password: string) => {
    if (name === VALID_USER && password === VALID_PASS) {
      setUser(name);
      localStorage.setItem("queue-care-user", name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("queue-care-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
