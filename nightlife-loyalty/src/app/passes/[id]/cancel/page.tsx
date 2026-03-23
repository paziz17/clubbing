"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CancelPassPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleCancel = async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/passes/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("done");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      {status === "idle" && (
        <>
          <p className="text-white mb-4">האם לבטל את ה-Pass?</p>
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-50"
            >
              כן, בטל
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:text-white"
            >
              לא, חזור
            </Link>
          </div>
        </>
      )}
      {status === "loading" && <p className="text-zinc-500">מבטל...</p>}
      {status === "done" && (
        <>
          <p className="text-green-400 mb-4">ה-Pass בוטל</p>
          <Link href="/" className="text-rose-500 hover:text-rose-400">
            חזרה לדף הבית
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-rose-400 mb-4">{error}</p>
          <Link href="/" className="text-rose-500 hover:text-rose-400">
            חזרה לדף הבית
          </Link>
        </>
      )}
    </div>
  );
}
