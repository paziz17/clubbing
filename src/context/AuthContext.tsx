"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  location?: string;
  gender?: string;
  profilePhotoUrl?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  loginGuest: () => void;
  logout: () => void;
  signInWithProvider: (provider: "facebook" | "google" | "instagram") => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [guestUser, setGuestUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<{ profilePhotoUrl?: string; name?: string } | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("clubbing_guest") : null;
    if (stored) {
      try {
        setGuestUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch("/api/user/me")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setDbProfile({ profilePhotoUrl: data.profilePhotoUrl, name: data.name }))
        .catch(() => setDbProfile(null));
    } else {
      setDbProfile(null);
    }
  }, [status, session?.user?.email]);

  const saveGuest = (u: User) => {
    localStorage.setItem("clubbing_guest", JSON.stringify(u));
    setGuestUser(u);
  };

  const clearGuest = () => {
    localStorage.removeItem("clubbing_guest");
    setGuestUser(null);
  };

  const login = (u: User) => saveGuest(u);
  const loginGuest = () => saveGuest({ id: "guest-" + Date.now(), name: "אורח", isGuest: true });
  const logout = () => {
    clearGuest();
    setDbProfile(null);
    if (session) signOut();
  };

  const signInWithProvider = (provider: "facebook" | "google" | "instagram") => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    signIn(provider, { callbackUrl: `${base}/interests` });
  };

  const user: User | null =
    status === "authenticated" && session?.user
      ? (() => {
          const name = dbProfile?.name ?? session.user.name ?? "";
          const parts = name.trim().split(/\s+/);
          const firstName = parts[0] ?? "";
          const lastName = parts.slice(1).join(" ") || undefined;
          const profilePhotoUrl = session.user.image ?? dbProfile?.profilePhotoUrl ?? undefined;
          return {
            id: (session.user as { id?: string }).id ?? session.user.email ?? "user",
            name: dbProfile?.name ?? session.user.name ?? undefined,
            firstName: firstName || undefined,
            lastName: lastName,
            email: session.user.email ?? undefined,
            profilePhotoUrl,
            isGuest: false,
          };
        })()
      : guestUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: status === "loading" || loading,
        login,
        loginGuest,
        logout,
        signInWithProvider,
      }}
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
