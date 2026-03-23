"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import QRCode from "qrcode";

export default function PassPage() {
  const params = useParams();
  const clubId = params.id as string;
  const { token } = useAuth();
  const [pass, setPass] = useState<{
    id: string;
    qrToken: string;
    status: string;
    startTime: string;
    endTime: string;
    clubName?: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/clubs/${clubId}/passes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPass(data);
        return data.qrToken;
      })
      .then((qrToken) => {
        if (qrToken) {
          return QRCode.toDataURL(qrToken, { width: 280, margin: 2 });
        }
      })
      .then((url) => url && setQrDataUrl(url))
      .catch((e) => setError((e as Error).message));
  }, [clubId, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
        <p className="text-rose-400 mb-4">{error}</p>
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          חזרה לדף הבית
        </Link>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-zinc-500">יוצר Pass...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3">
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
      </header>
      <main className="max-w-md mx-auto px-4 py-8 flex flex-col items-center">
        <h2 className="text-xl font-bold text-white mb-2">ה-Pass שלך</h2>
        <p className="text-zinc-500 text-sm mb-6">
          הצג את ה-QR בכניסה למועדון
        </p>
        <div className="bg-white p-4 rounded-2xl mb-6">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-72 h-72" />
          ) : (
            <div className="w-72 h-72 bg-zinc-200 animate-pulse rounded" />
          )}
        </div>
        <p className="text-zinc-400 text-sm">
          תוקף: {new Date(pass.startTime).toLocaleString("he-IL")} -{" "}
          {new Date(pass.endTime).toLocaleString("he-IL")}
        </p>
        <Link
          href={`/passes/${pass.id}/cancel`}
          className="mt-8 text-zinc-500 hover:text-rose-400 text-sm"
        >
          ביטול Pass
        </Link>
      </main>
    </div>
  );
}
