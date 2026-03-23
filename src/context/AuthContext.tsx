"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { getPostAuthCallbackUrl } from "@/lib/post-auth-redirect";

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
  /** תצוגת ממשק מלאה בפיתוח — לא משתמש אמיתי ב-DB */
  isDeveloper?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  loginGuest: () => void;
  loginDeveloper: () => void;
  logout: () => void;
  signInWithProvider: (provider: "facebook" | "google" | "instagram") => void;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GUEST_STORAGE_KEY = "clubing_guest";
const LEGACY_GUEST_KEY = "clubbing_guest";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [guestUser, setGuestUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<{ profilePhotoUrl?: string; name?: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    const stored =
      localStorage.getItem(GUEST_STORAGE_KEY) ?? localStorage.getItem(LEGACY_GUEST_KEY);
    if (stored) {
      try {
        setGuestUser(JSON.parse(stored));
        if (!localStorage.getItem(GUEST_STORAGE_KEY) && localStorage.getItem(LEGACY_GUEST_KEY)) {
          localStorage.setItem(GUEST_STORAGE_KEY, stored);
          localStorage.removeItem(LEGACY_GUEST_KEY);
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch("/api/user/me")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setDbProfile({ profilePhotoUrl: data.profilePhotoUrl, name: data.name });
            // אם אין תמונה — נסה לסנכרן מ-Google
            if (!data.profilePhotoUrl && !session?.user?.image) {
              fetch("/api/user/sync-google-profile", { method: "POST" })
                .then((r) => r.ok ? r.json() : null)
                .then((sync) => {
                  if (sync?.profilePhotoUrl) {
                    setDbProfile((p) => ({ ...p!, profilePhotoUrl: sync.profilePhotoUrl }));
                    update();
                  }
                });
            }
          }
        })
        .catch(() => setDbProfile(null));
    } else {
      setDbProfile(null);
    }
  }, [status, session?.user?.email, session?.user?.image]);

  const saveGuest = (u: User) => {
    const json = JSON.stringify(u);
    localStorage.setItem(GUEST_STORAGE_KEY, json);
    localStorage.removeItem(LEGACY_GUEST_KEY);
    setGuestUser(u);
  };

  const clearGuest = () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(LEGACY_GUEST_KEY);
    setGuestUser(null);
  };

  const login = (u: User) => saveGuest(u);
  const loginGuest = () => saveGuest({ id: "guest-" + Date.now(), name: "אורח", isGuest: true });
  const loginDeveloper = () =>
    saveGuest({
      id: "dev-preview-" + Date.now(),
      name: "מפתח",
      isGuest: false,
      isDeveloper: true,
    });
  const logout = () => {
    clearGuest();
    setDbProfile(null);
    if (session) signOut();
  };

  const signInWithProvider = (provider: "facebook" | "google" | "instagram") => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    signIn(provider, { callbackUrl: getPostAuthCallbackUrl(base) });
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const res = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
      callbackUrl: getPostAuthCallbackUrl(base),
    });
    if (res?.error) return { ok: false, error: res.error };
    if (res?.ok) return { ok: true };
    return { ok: false, error: "CredentialsSignin" };
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
        loginDeveloper,
        logout,
        signInWithProvider,
        signInWithEmailPassword,
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
