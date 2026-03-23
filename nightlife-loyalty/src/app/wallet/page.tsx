"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function WalletContent() {
  const searchParams = useSearchParams();
  const paramClubId = searchParams.get("club_id") || "";
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [ledger, setLedger] = useState<Array<{ type: string; amount: number; createdAt: string }>>([]);
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [redeemCredits, setRedeemCredits] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ code?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.clubs || [];
        setClubs(list);
        return list;
      });
  }, [token]);

  const clubId = paramClubId || (clubs[0]?.id ?? "");

  useEffect(() => {
    if (!token || !clubId) return;
    fetch(`/api/wallet?club_id=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((w) => {
        setBalance(w.balance || 0);
        setExpiringSoon(w.expiringSoon || 0);
      });
    fetch(`/api/wallet/ledger?club_id=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setLedger);
  }, [token, clubId]);

  const handleRedeem = async () => {
    const credits = parseInt(redeemCredits, 10);
    if (!credits || credits <= 0 || !token || !clubId) return;
    fetch("/api/wallet/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ club_id: clubId, credits }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRedeemResult(data);
        setBalance((b) => b - credits);
        setRedeemCredits("");
      })
      .catch((e) => alert((e as Error).message));
  };

  const typeLabels: Record<string, string> = {
    EARN: "צבירה",
    REDEEM: "מימוש",
    ADJUST: "בונוס",
    EXPIRE: "פקיעה",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3">
        <Link href="/profile" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">ארנק</h1>

        {clubs.length > 1 && (
          <select
            value={clubId}
            onChange={(e) => {
              window.location.href = `?club_id=${e.target.value}`;
            }}
            className="w-full px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white mb-6"
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-6 mb-6">
          <p className="text-zinc-500 text-sm">יתרה פעילה</p>
          <p className="text-3xl font-bold text-rose-400 mt-1">{balance} קרדיטים</p>
          {expiringSoon > 0 && (
            <p className="text-amber-400 text-sm mt-2">
              {expiringSoon} קרדיטים יפוגו בקרוב!
            </p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">מממש קרדיטים</h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="כמות"
              value={redeemCredits}
              onChange={(e) => setRedeemCredits(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#14141f] border border-zinc-700 rounded-xl text-white"
            />
            <button
              onClick={handleRedeem}
              disabled={!redeemCredits || parseInt(redeemCredits, 10) > balance}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium"
            >
              מממש
            </button>
          </div>
          {redeemResult?.code && (
            <p className="text-amber-400 mt-2 text-sm">
              קוד: {redeemResult.code} - הצג לצוות הבר
            </p>
          )}
        </div>

        <h2 className="text-lg font-semibold text-white mb-3">היסטוריה</h2>
        <div className="space-y-2">
          {ledger.map((e) => (
            <div
              key={e.createdAt + e.amount}
              className="flex justify-between py-2 border-b border-zinc-800"
            >
              <span className="text-zinc-400">{typeLabels[e.type] || e.type}</span>
              <span className={e.amount >= 0 ? "text-green-400" : "text-rose-400"}>
                {e.amount >= 0 ? "+" : ""}{e.amount}
              </span>
              <span className="text-zinc-600 text-sm">
                {new Date(e.createdAt).toLocaleDateString("he-IL")}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">טוען...</div>}>
      <WalletContent />
    </Suspense>
  );
}
