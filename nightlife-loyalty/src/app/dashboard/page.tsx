"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([]);
  const [clubId, setClubId] = useState("");
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; runCount: number }>>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignCredits, setNewCampaignCredits] = useState("10");
  const [overview, setOverview] = useState<{
    gmv?: number;
    uniqueVisitors?: number;
    totalVisits?: number;
    avgSpend?: number;
    creditsEarned?: number;
    creditsRedeemed?: number;
  } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; tier: string; visits: number; spend: number }>>([]);

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
    if (!clubId) return;
    fetch(`/api/dashboard/overview?club_id=${clubId}`)
      .then((r) => r.json())
      .then(setOverview);
    fetch(`/api/dashboard/users?club_id=${clubId}`)
      .then((r) => r.json())
      .then(setUsers);
    fetch(`/api/campaigns?club_id=${clubId}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setCampaigns(data) : setCampaigns([]));
  }, [clubId]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-rose-500 hover:text-rose-400">
          ← חזרה
        </Link>
        <h1 className="text-lg font-bold text-white">דשבורד ניהולי</h1>
      </header>

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

      <main className="p-4 max-w-4xl mx-auto">
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">GMV</p>
              <p className="text-2xl font-bold text-white">₪{overview.gmv?.toLocaleString()}</p>
            </div>
            <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">מבקרים ייחודיים</p>
              <p className="text-2xl font-bold text-white">{overview.uniqueVisitors}</p>
            </div>
            <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">ממוצע הוצאה לביקור</p>
              <p className="text-2xl font-bold text-white">₪{overview.avgSpend?.toFixed(0)}</p>
            </div>
            <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">קרדיטים שנצברו</p>
              <p className="text-2xl font-bold text-rose-400">{overview.creditsEarned}</p>
            </div>
            <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-sm">קרדיטים שמומשו</p>
              <p className="text-2xl font-bold text-green-400">{overview.creditsRedeemed}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">קמפיינים</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="שם קמפיין"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className="flex-1 px-4 py-2 bg-[#14141f] border border-zinc-700 rounded-lg text-white"
            />
            <input
              type="number"
              placeholder="קרדיטים"
              value={newCampaignCredits}
              onChange={(e) => setNewCampaignCredits(e.target.value)}
              className="w-24 px-4 py-2 bg-[#14141f] border border-zinc-700 rounded-lg text-white"
            />
            <button
              onClick={async () => {
                if (!newCampaignName || !clubId) return;
                const res = await fetch("/api/campaigns", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    club_id: clubId,
                    name: newCampaignName,
                    filters: { visited_in_last_days: 30 },
                    action: "grant_bonus_credits",
                    action_meta: { credits: parseInt(newCampaignCredits, 10) || 10 },
                  }),
                });
                if (res.ok) {
                  setNewCampaignName("");
                  const data = await fetch(`/api/campaigns?club_id=${clubId}`).then((r) => r.json());
                  setCampaigns(Array.isArray(data) ? data : []);
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
            >
              צור קמפיין
            </button>
          </div>
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-[#14141f] rounded-lg">
                <span className="text-white">{c.name}</span>
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/campaigns/${c.id}/run`, { method: "POST" });
                    const data = await res.json();
                    alert(data.affected ? `${data.affected} משתמשים קיבלו בונוס` : data.error);
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded"
                >
                  הפעל
                </button>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">משתמשים</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-zinc-500 text-sm border-b border-zinc-800">
                <th className="py-3 px-2">שם</th>
                <th className="py-3 px-2">Tier</th>
                <th className="py-3 px-2">ביקורים</th>
                <th className="py-3 px-2">הוצאה</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50">
                  <td className="py-3 px-2 text-white">{u.name}</td>
                  <td className="py-3 px-2 text-zinc-400">{u.tier}</td>
                  <td className="py-3 px-2 text-zinc-400">{u.visits}</td>
                  <td className="py-3 px-2 text-white">₪{u.spend?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
