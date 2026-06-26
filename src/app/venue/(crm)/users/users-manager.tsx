"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";
import { UserPlus, Shield, KeyRound, Trash2, Power } from "lucide-react";

interface CrmUser {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
}

const ROLE_DESC: Record<Role, string> = {
  OWNER: "גישה מלאה כולל ניהול משתמשים והגדרות",
  MANAGER: "גישה תפעולית מלאה כולל החזרים — ללא ניהול משתמשים",
  STAFF: "תפעול יומי: אירועים, הזמנות, לקוחות, מלאי, משמרות",
  DOOR: "כניסה בלבד — סריקת QR וערב חי",
  BAR: "מכירה מהירה בבר בלבד — ללא חשיפת נתוני CRM",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-gold/15 text-gold border-gold/30",
  MANAGER: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  STAFF: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  DOOR: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  BAR: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export function UsersManager({
  initialUsers,
  venueUsername,
}: {
  initialUsers: CrmUser[];
  venueUsername: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<CrmUser[]>(initialUsers);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "STAFF" as Role });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/venue/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    router.refresh();
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/venue/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "שגיאה ביצירת משתמש");
      return;
    }
    setForm({ name: "", username: "", password: "", role: "STAFF" });
    await refresh();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/venue/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await refresh();
  }

  async function resetPassword(u: CrmUser) {
    const pw = window.prompt(`סיסמה חדשה ל-${u.name} (לפחות 6 תווים):`);
    if (!pw) return;
    if (pw.length < 6) { alert("סיסמה קצרה מדי"); return; }
    await patch(u.id, { password: pw });
    alert("הסיסמה עודכנה");
  }

  async function remove(u: CrmUser) {
    if (!window.confirm(`למחוק את המשתמש ${u.name}? פעולה זו בלתי הפיכה.`)) return;
    const res = await fetch(`/api/venue/users/${u.id}`, { method: "DELETE" });
    if (res.ok) await refresh();
  }

  return (
    <div className="space-y-8">
      {/* Add user */}
      <div className="bg-bg-card border border-line rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-gold" />
          <h2 className="font-semibold text-ink">הוספת חשבון צוות</h2>
        </div>
        <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-ink-muted mb-1.5">שם מלא</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ישראל ישראלי" required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-ink-muted mb-1.5">שם משתמש</label>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="israel" required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-ink-muted mb-1.5">סיסמה</label>
            <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6+ תווים" required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-ink-muted mb-1.5">תפקיד</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <button disabled={busy} className="btn-gold w-full h-10 text-sm font-semibold">
              {busy ? "מוסיף..." : "הוסף משתמש"}
            </button>
          </div>
        </form>
        {error && <p className="text-danger text-sm mt-3">{error}</p>}
        <p className="text-xs text-ink-dim mt-3">
          <b>{ROLE_LABELS[form.role]}:</b> {ROLE_DESC[form.role]}
        </p>
      </div>

      {/* Users list */}
      <div className="bg-bg-card border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" />
          <h2 className="font-semibold text-ink">חשבונות הצוות ({users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-dim text-xs border-b border-line">
              <th className="text-right px-5 py-2.5 font-medium">שם</th>
              <th className="text-right px-3 py-2.5 font-medium">שם משתמש</th>
              <th className="text-right px-3 py-2.5 font-medium">תפקיד</th>
              <th className="text-right px-3 py-2.5 font-medium">סטטוס</th>
              <th className="text-right px-3 py-2.5 font-medium">כניסה אחרונה</th>
              <th className="text-left px-5 py-2.5 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-dim">
                אין עדיין חשבונות צוות. החשבון הראשי (<b>{venueUsername}</b>) משמש כבעלים.
              </td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/50 hover:bg-bg-elevated/40">
                <td className="px-5 py-3 text-ink font-medium">{u.name}</td>
                <td className="px-3 py-3 text-ink-muted font-mono text-xs">{u.username}</td>
                <td className="px-3 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className={`text-xs rounded-full border px-2.5 py-1 bg-transparent ${ROLE_COLORS[u.role] ?? ""}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-bg-card text-ink">{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  {u.active
                    ? <span className="text-emerald-400 text-xs">פעיל</span>
                    : <span className="text-ink-dim text-xs">מושבת</span>}
                </td>
                <td className="px-3 py-3 text-ink-dim text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => resetPassword(u)} title="איפוס סיסמה" className="p-1.5 rounded-lg text-ink-muted hover:text-gold hover:bg-gold/10">
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button onClick={() => patch(u.id, { active: !u.active })} title={u.active ? "השבת" : "הפעל"} className="p-1.5 rounded-lg text-ink-muted hover:text-sky-300 hover:bg-sky-500/10">
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(u)} title="מחיקה" className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
