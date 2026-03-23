"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function StaffPage() {
  const [mode, setMode] = useState<"scan" | "transaction" | "visitors">("scan");
  const [qrInput, setQrInput] = useState("");
  const [checkinResult, setCheckinResult] = useState<{
    success?: boolean;
    error?: string;
    alreadyCheckedIn?: boolean;
    user?: { name: string; profilePhotoUrl?: string };
    visitId?: string;
  } | null>(null);
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [clubId, setClubId] = useState("");
  const [visitors, setVisitors] = useState<Array<{ id: string; userName: string; checkInTime: string }>>([]);
  const [txUserId, setTxUserId] = useState("");
  const [txVisitId, setTxVisitId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txResult, setTxResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.clubs || [];
        setClubs(list);
        if (list[0]) setClubId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (mode !== "visitors" || !clubId) return;
    fetch(`/api/crm/visitors?club_id=${clubId}&date=${new Date().toISOString().split("T")[0]}`)
      .then((r) => r.json())
      .then(setVisitors);
  }, [mode, clubId]);

  const handleCheckin = async () => {
    if (!qrInput.trim()) return;
    setCheckinResult(null);
    try {
      const res = await fetch("/api/crm/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrInput.trim() }),
      });
      const data = await res.json();
      setCheckinResult(data);
      if (res.ok) setQrInput("");
    } catch (e) {
      setCheckinResult({ error: (e as Error).message });
    }
  };

  const handleTransaction = async () => {
    if (!txUserId || !txAmount || !clubId) return;
    setTxResult(null);
    try {
      const res = await fetch("/api/crm/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: txUserId,
          visit_id: txVisitId || undefined,
          club_id: clubId,
          amount: parseFloat(txAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTxResult(`הצלחה! ${data.creditsEarned} קרדיטים נצברו`);
      setTxAmount("");
      setTxVisitId("");
    } catch (e) {
      setTxResult((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
        <h1 className="text-lg font-bold text-white">ממשק צוות</h1>
      </header>

      <div className="flex gap-2 p-4 border-b border-zinc-800">
        <button
          onClick={() => setMode("scan")}
          className={`px-4 py-2 rounded-lg ${mode === "scan" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
        >
          סריקת QR
        </button>
        <button
          onClick={() => setMode("transaction")}
          className={`px-4 py-2 rounded-lg ${mode === "transaction" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
        >
          הזנת עסקה
        </button>
        <button
          onClick={() => setMode("visitors")}
          className={`px-4 py-2 rounded-lg ${mode === "visitors" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-400"}`}
        >
          מבקרים
        </button>
      </div>

      {clubs.length > 0 && (
        <div className="p-4">
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full px-4 py-2 bg-[#14141f] border border-zinc-700 rounded-lg text-white"
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <main className="p-4 max-w-lg mx-auto">
        {mode === "scan" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="הדבק טוקן QR או סרוק"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
              className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
            />
            <button
              onClick={handleCheckin}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium"
            >
              בדוק כניסה
            </button>
            {checkinResult && (
              <div
                className={`p-4 rounded-xl ${
                  checkinResult.success
                    ? "bg-green-900/30 text-green-400"
                    : checkinResult.alreadyCheckedIn
                    ? "bg-amber-900/30 text-amber-400"
                    : "bg-rose-900/30 text-rose-400"
                }`}
              >
                {checkinResult.success && (
                  <p>✓ {checkinResult.user?.name} נכנס. Visit ID: {checkinResult.visitId}</p>
                )}
                {checkinResult.alreadyCheckedIn && (
                  <p>⚠ {checkinResult.user?.name} כבר נכנס!</p>
                )}
                {checkinResult.error && !checkinResult.alreadyCheckedIn && (
                  <p>{checkinResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "transaction" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="User ID"
              value={txUserId}
              onChange={(e) => setTxUserId(e.target.value)}
              className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white"
            />
            <input
              type="text"
              placeholder="Visit ID (אופציונלי)"
              value={txVisitId}
              onChange={(e) => setTxVisitId(e.target.value)}
              className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white"
            />
            <input
              type="number"
              placeholder="סכום (₪)"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white"
            />
            <button
              onClick={handleTransaction}
              disabled={!txUserId || !txAmount}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium"
            >
              הזן עסקה
            </button>
            {txResult && (
              <p className={txResult.startsWith("הצלחה") ? "text-green-400" : "text-rose-400"}>
                {txResult}
              </p>
            )}
          </div>
        )}

        {mode === "visitors" && (
          <div className="space-y-2">
            {visitors.map((v) => (
              <div
                key={v.id}
                className="flex justify-between p-3 bg-[#14141f] rounded-xl"
              >
                <span className="text-white">{v.userName}</span>
                <span className="text-zinc-500 text-sm">
                  {new Date(v.checkInTime).toLocaleTimeString("he-IL")}
                </span>
              </div>
            ))}
            {visitors.length === 0 && (
              <p className="text-zinc-500 text-center py-8">אין מבקרים היום</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
