"use client";

import { useMemo, useState } from "react";
import {
  Users,
  CalendarDays,
  Clock,
  Wallet,
  Plus,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Pencil,
  LogIn,
  LogOut,
  X,
  AlertTriangle,
} from "lucide-react";

type Employee = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  hourlyWageAgorot: number;
  color: string;
  active: boolean;
  notes?: string | null;
};

type Shift = {
  id: string;
  employeeId: string;
  eventId?: string | null;
  role: string;
  startsAt: string;
  endsAt: string;
  status: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  breakMinutes: number;
  hourlyWageAgorot: number;
  notes?: string | null;
  employee: Employee;
};

type EventLite = { id: string; name: string; startsAt: string };

const ROLES: Record<string, string> = {
  MANAGER: "מנהל/ת",
  BARTENDER: "ברמן/ית",
  WAITER: "מלצר/ית",
  SECURITY: "אבטחה",
  KITCHEN: "מטבח",
  HOST: "מארח/ת",
  DJ: "תקליטן",
  CLEANING: "ניקיון",
  OTHER: "אחר",
};

const STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "מתוכננת", cls: "bg-ink-dim/15 text-ink-muted" },
  CONFIRMED: { label: "אושרה", cls: "bg-sky-500/15 text-sky-400" },
  COMPLETED: { label: "הושלמה", cls: "bg-emerald-500/15 text-emerald-400" },
  NO_SHOW: { label: "לא הגיע", cls: "bg-danger/15 text-danger" },
  CANCELLED: { label: "בוטלה", cls: "bg-ink-dim/10 text-ink-dim line-through" },
};

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const PALETTE = ["#D4AF37", "#60A5FA", "#34D399", "#F472B6", "#A78BFA", "#FB923C", "#22D3EE", "#F87171"];

function shekel(agorot: number) {
  return "₪" + (agorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 });
}

function shiftHours(s: { startsAt: string; endsAt: string; breakMinutes: number }) {
  const ms = new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime();
  return Math.max(0, ms / 3600000 - (s.breakMinutes || 0) / 60);
}
function shiftCost(s: Shift) {
  return shiftHours(s) * s.hourlyWageAgorot;
}

export function StaffClient({
  initialEmployees,
  initialShifts,
  events,
  weekStart,
}: {
  venueName: string;
  initialEmployees: Employee[];
  initialShifts: Shift[];
  events: EventLite[];
  weekStart: string;
}) {
  const [tab, setTab] = useState<"schedule" | "employees">("schedule");
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [week, setWeek] = useState(() => new Date(weekStart));
  const [loading, setLoading] = useState(false);

  const [shiftModal, setShiftModal] = useState<{ open: boolean; day?: Date; edit?: Shift }>({ open: false });
  const [empModal, setEmpModal] = useState<{ open: boolean; edit?: Employee }>({ open: false });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(week);
      d.setDate(week.getDate() + i);
      return d;
    });
  }, [week]);

  async function loadWeek(newWeek: Date) {
    setWeek(newWeek);
    setLoading(true);
    const from = new Date(newWeek);
    const to = new Date(newWeek);
    to.setDate(to.getDate() + 7);
    try {
      const res = await fetch(`/api/venue/shifts?from=${from.toISOString()}&to=${to.toISOString()}`);
      const data = await res.json();
      if (data.shifts) setShifts(data.shifts);
    } finally {
      setLoading(false);
    }
  }

  const activeEmployees = employees.filter((e) => e.active);
  const totalHours = shifts.reduce((s, x) => (x.status === "CANCELLED" ? s : s + shiftHours(x)), 0);
  const totalCost = shifts.reduce((s, x) => (x.status === "CANCELLED" ? s : s + shiftCost(x)), 0);

  function shiftsForDay(day: Date) {
    return shifts
      .filter((s) => {
        const d = new Date(s.startsAt);
        return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
      })
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }

  const today = new Date();
  const weekLabel = `${weekDays[0].toLocaleDateString("he-IL", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("he-IL", { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Users} label="עובדים פעילים" value={String(activeEmployees.length)} />
        <Kpi icon={CalendarDays} label="משמרות השבוע" value={String(shifts.filter((s) => s.status !== "CANCELLED").length)} />
        <Kpi icon={Clock} label="שעות עבודה" value={totalHours.toLocaleString("he-IL", { maximumFractionDigits: 1 })} />
        <Kpi icon={Wallet} label="עלות שכר שבועית" value={shekel(totalCost)} accent />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line">
        <TabBtn active={tab === "schedule"} onClick={() => setTab("schedule")}>לוח משמרות</TabBtn>
        <TabBtn active={tab === "employees"} onClick={() => setTab("employees")}>עובדים ({employees.length})</TabBtn>
      </div>

      {tab === "schedule" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => { const w = new Date(week); w.setDate(w.getDate() - 7); loadWeek(w); }} className="p-2 rounded-lg border border-line hover:bg-bg-card text-ink-muted">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-sm font-semibold text-ink min-w-[140px] text-center">{weekLabel}</div>
              <button onClick={() => { const w = new Date(week); w.setDate(w.getDate() + 7); loadWeek(w); }} className="p-2 rounded-lg border border-line hover:bg-bg-card text-ink-muted">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {loading && <span className="text-xs text-ink-dim">טוען…</span>}
            </div>
            <button
              onClick={() => setShiftModal({ open: true })}
              disabled={activeEmployees.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> משמרת חדשה
            </button>
          </div>

          {activeEmployees.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-ink-muted bg-bg-card border border-line rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-gold" /> הוסף עובדים בלשונית "עובדים" כדי לשבץ משמרות.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dayShifts = shiftsForDay(day);
              const isToday = day.toDateString() === today.toDateString();
              const dayCost = dayShifts.reduce((s, x) => (x.status === "CANCELLED" ? s : s + shiftCost(x)), 0);
              return (
                <div key={i} className={`rounded-xl border min-h-[140px] flex flex-col ${isToday ? "border-gold/40 bg-gold/5" : "border-line bg-bg-soft"}`}>
                  <button
                    onClick={() => setShiftModal({ open: true, day })}
                    className="px-3 py-2 border-b border-line/60 text-right hover:bg-bg-card rounded-t-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isToday ? "text-gold" : "text-ink"}`}>{DAYS[i]}</span>
                      <Plus className="w-3.5 h-3.5 text-ink-dim group-hover:text-gold" />
                    </div>
                    <div className="text-[10px] text-ink-dim">{day.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}</div>
                  </button>
                  <div className="p-1.5 space-y-1.5 flex-1">
                    {dayShifts.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setShiftModal({ open: true, edit: s })}
                        className="w-full text-right rounded-lg px-2 py-1.5 border border-line bg-bg-card hover:border-gold/40 transition-colors"
                        style={{ borderRightWidth: 3, borderRightColor: s.employee.color }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-ink truncate">{s.employee.name}</span>
                          <span className={`text-[9px] px-1 rounded ${STATUS[s.status]?.cls}`}>{STATUS[s.status]?.label}</span>
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {new Date(s.startsAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}–
                          {new Date(s.endsAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} · {ROLES[s.role] ?? s.role}
                        </div>
                      </button>
                    ))}
                  </div>
                  {dayCost > 0 && <div className="px-2 py-1 text-[10px] text-ink-dim border-t border-line/60 text-left">{shekel(dayCost)}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "employees" && (
        <EmployeesTable
          employees={employees}
          onAdd={() => setEmpModal({ open: true })}
          onEdit={(e) => setEmpModal({ open: true, edit: e })}
          onChanged={setEmployees}
        />
      )}

      {shiftModal.open && (
        <ShiftModal
          employees={activeEmployees}
          events={events}
          day={shiftModal.day}
          edit={shiftModal.edit}
          onClose={() => setShiftModal({ open: false })}
          onSaved={(s, removedId) => {
            setShifts((prev) => {
              let next = prev.filter((x) => x.id !== (removedId ?? s?.id));
              if (s) next = [...next, s];
              return next;
            });
            setShiftModal({ open: false });
          }}
        />
      )}

      {empModal.open && (
        <EmployeeModal
          edit={empModal.edit}
          usedColors={employees.map((e) => e.color)}
          onClose={() => setEmpModal({ open: false })}
          onSaved={(e) => {
            setEmployees((prev) => {
              const exists = prev.some((x) => x.id === e.id);
              return exists ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e];
            });
            setEmpModal({ open: false });
          }}
        />
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-gold/30 bg-gold/5" : "border-line bg-bg-soft"}`}>
      <div className="flex items-center gap-2 text-ink-muted text-xs mb-1.5">
        <Icon className={`w-4 h-4 ${accent ? "text-gold" : ""}`} /> {label}
      </div>
      <div className={`text-2xl font-display ${accent ? "text-gold" : "text-ink"}`}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${active ? "border-gold text-gold" : "border-transparent text-ink-muted hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function EmployeesTable({
  employees,
  onAdd,
  onEdit,
  onChanged,
}: {
  employees: Employee[];
  onAdd: () => void;
  onEdit: (e: Employee) => void;
  onChanged: (e: Employee[]) => void;
}) {
  async function toggleActive(e: Employee) {
    const res = await fetch(`/api/venue/employees/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !e.active }),
    });
    const data = await res.json();
    if (data.employee) onChanged(employees.map((x) => (x.id === e.id ? data.employee : x)));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90">
          <Plus className="w-4 h-4" /> עובד חדש
        </button>
      </div>
      <div className="rounded-xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft text-ink-muted text-xs">
            <tr>
              <th className="text-right px-4 py-2.5 font-medium">עובד</th>
              <th className="text-right px-4 py-2.5 font-medium">תפקיד</th>
              <th className="text-right px-4 py-2.5 font-medium">טלפון</th>
              <th className="text-right px-4 py-2.5 font-medium">שכר/שעה</th>
              <th className="text-right px-4 py-2.5 font-medium">סטטוס</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-line hover:bg-bg-soft/50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="font-medium text-ink">{e.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{ROLES[e.role] ?? e.role}</td>
                <td className="px-4 py-2.5 text-ink-muted" dir="ltr">{e.phone || "—"}</td>
                <td className="px-4 py-2.5 text-ink-muted">{shekel(e.hourlyWageAgorot)}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggleActive(e)}
                    className={`text-xs px-2 py-0.5 rounded-full ${e.active ? "bg-emerald-500/15 text-emerald-400" : "bg-ink-dim/15 text-ink-dim"}`}
                  >
                    {e.active ? "פעיל" : "לא פעיל"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-left">
                  <button onClick={() => onEdit(e)} className="p-1.5 rounded hover:bg-bg-card text-ink-muted hover:text-gold">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-dim text-sm">אין עובדים עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-soft border border-line rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-bg-soft">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-card text-ink-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-gold/50 outline-none";
const labelCls = "block text-xs text-ink-muted mb-1";

function EmployeeModal({ edit, usedColors, onClose, onSaved }: { edit?: Employee; usedColors: string[]; onClose: () => void; onSaved: (e: Employee) => void }) {
  const nextColor = PALETTE.find((c) => !usedColors.includes(c)) ?? PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const [name, setName] = useState(edit?.name ?? "");
  const [role, setRole] = useState(edit?.role ?? "WAITER");
  const [phone, setPhone] = useState(edit?.phone ?? "");
  const [wage, setWage] = useState(((edit?.hourlyWageAgorot ?? 4000) / 100).toString());
  const [color, setColor] = useState(edit?.color ?? nextColor);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (name.trim().length < 2) { setErr("שם קצר מדי"); return; }
    setBusy(true); setErr("");
    const payload = { name: name.trim(), role, phone: phone || null, hourlyWageAgorot: Math.round(parseFloat(wage || "0") * 100), color };
    const res = await fetch(edit ? `/api/venue/employees/${edit.id}` : "/api/venue/employees", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (data.employee) onSaved(data.employee);
    else setErr("שגיאה בשמירה");
  }

  return (
    <Modal title={edit ? "עריכת עובד" : "עובד חדש"} onClose={onClose}>
      {err && <div className="text-xs text-danger">{err}</div>}
      <div><label className={labelCls}>שם מלא</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div>
        <label className={labelCls}>תפקיד</label>
        <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>טלפון</label><input dir="ltr" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><label className={labelCls}>שכר לשעה (₪)</label><input type="number" className={inputCls} value={wage} onChange={(e) => setWage(e.target.value)} /></div>
      </div>
      <div>
        <label className={labelCls}>צבע בלוח</label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-ink" : "border-transparent"}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      <button onClick={save} disabled={busy} className="w-full py-2.5 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">
        {busy ? "שומר…" : "שמירה"}
      </button>
    </Modal>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ShiftModal({
  employees,
  events,
  day,
  edit,
  onClose,
  onSaved,
}: {
  employees: Employee[];
  events: EventLite[];
  day?: Date;
  edit?: Shift;
  onClose: () => void;
  onSaved: (s: Shift | null, removedId?: string) => void;
}) {
  const base = day ? new Date(day) : edit ? new Date(edit.startsAt) : new Date();
  const defStart = edit ? new Date(edit.startsAt) : (() => { const d = new Date(base); d.setHours(20, 0, 0, 0); return d; })();
  const defEnd = edit ? new Date(edit.endsAt) : (() => { const d = new Date(base); d.setHours(23, 59, 0, 0); return d; })();

  const [employeeId, setEmployeeId] = useState(edit?.employeeId ?? employees[0]?.id ?? "");
  const [role, setRole] = useState(edit?.role ?? employees[0]?.role ?? "WAITER");
  const [startsAt, setStartsAt] = useState(toLocalInput(defStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(defEnd));
  const [breakMinutes, setBreakMinutes] = useState(String(edit?.breakMinutes ?? 0));
  const [status, setStatus] = useState(edit?.status ?? "SCHEDULED");
  const [eventId, setEventId] = useState(edit?.eventId ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const previewHours = shiftHours({ startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), breakMinutes: parseInt(breakMinutes || "0") });
  const emp = employees.find((e) => e.id === employeeId) ?? edit?.employee;
  const previewCost = previewHours * (emp?.hourlyWageAgorot ?? 0);

  async function save() {
    setBusy(true); setErr("");
    const payload: any = {
      employeeId, role, status,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      breakMinutes: parseInt(breakMinutes || "0"),
      eventId: eventId || null,
    };
    const res = await fetch(edit ? `/api/venue/shifts/${edit.id}` : "/api/venue/shifts", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (data.shift) onSaved(data.shift, edit?.id);
    else setErr(data.message || "שגיאה בשמירה (ייתכן חפיפת משמרות)");
  }

  async function remove() {
    if (!edit) return;
    if (!confirm("למחוק את המשמרת?")) return;
    await fetch(`/api/venue/shifts/${edit.id}`, { method: "DELETE" });
    onSaved(null, edit.id);
  }

  async function clock(action: "clockIn" | "clockOut") {
    if (!edit) return;
    setBusy(true);
    const res = await fetch(`/api/venue/shifts/${edit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.shift) onSaved(data.shift, edit.id);
  }

  return (
    <Modal title={edit ? "עריכת משמרת" : "משמרת חדשה"} onClose={onClose}>
      {err && <div className="text-xs text-danger">{err}</div>}
      <div>
        <label className={labelCls}>עובד</label>
        <select className={inputCls} value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); const em = employees.find((x) => x.id === e.target.value); if (em && !edit) setRole(em.role); }}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          {edit && !employees.some((e) => e.id === edit.employeeId) && <option value={edit.employeeId}>{edit.employee.name}</option>}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>תפקיד</label>
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>סטטוס</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>התחלה</label><input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
        <div><label className={labelCls}>סיום</label><input type="datetime-local" className={inputCls} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>הפסקה (דק')</label><input type="number" className={inputCls} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} /></div>
        <div>
          <label className={labelCls}>שיוך לאירוע</label>
          <select className={inputCls} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">— ללא —</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs bg-bg-card rounded-lg px-3 py-2 border border-line">
        <span className="text-ink-muted">{previewHours.toLocaleString("he-IL", { maximumFractionDigits: 1 })} שעות</span>
        <span className="text-gold font-semibold">{shekel(previewCost)}</span>
      </div>

      {edit && (
        <div className="flex gap-2">
          <button onClick={() => clock("clockIn")} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line text-sm text-ink-muted hover:text-emerald-400 hover:border-emerald-400/40">
            <LogIn className="w-4 h-4" /> כניסה
          </button>
          <button onClick={() => clock("clockOut")} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line text-sm text-ink-muted hover:text-amber-400 hover:border-amber-400/40">
            <LogOut className="w-4 h-4" /> יציאה
          </button>
        </div>
      )}
      {edit && (edit.clockInAt || edit.clockOutAt) && (
        <div className="text-[11px] text-ink-dim text-center">
          {edit.clockInAt && <>כניסה {new Date(edit.clockInAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} </>}
          {edit.clockOutAt && <>· יציאה {new Date(edit.clockOutAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</>}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={busy || !employeeId} className="flex-1 py-2.5 rounded-lg bg-gold text-bg font-semibold text-sm hover:bg-gold/90 disabled:opacity-50">
          {busy ? "שומר…" : "שמירה"}
        </button>
        {edit && (
          <button onClick={remove} disabled={busy} className="px-3 py-2.5 rounded-lg border border-danger/40 text-danger hover:bg-danger/10">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </Modal>
  );
}
