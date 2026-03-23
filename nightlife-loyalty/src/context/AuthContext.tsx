"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  birthdate?: string;
  profilePhotoUrl?: string;
  city?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        setToken(t);
      } else {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (t) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem("token", t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
