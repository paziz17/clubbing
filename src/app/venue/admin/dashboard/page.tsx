"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Building2, Users, Calendar, Star, ExternalLink,
  RefreshCw, X, Eye, EyeOff, RotateCcw, Globe, LogOut, TrendingUp,
  ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle, Crown,
} from "lucide-react";

interface VenueRow {
  id: string; name: string; slug: string; username: string;
  city: string; logoUrl: string | null; address: string;
  _count: { events: number; reservations: number; transactions: number; reviews: number };
}

interface VenueDetail extends VenueRow {
  events: { id: string; name: string; startsAt: string; basePriceAgorot: number; status: string }[];
  reservations: { id: string; guestName: string; quantity: number; status: string; createdAt: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [resetVenue, setResetVenue] = useState<VenueRow | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [ops, setOps] = useState<{
    rows: { venueId: string; name: string; employees: number; shifts: number; laborAgorot: number; inventoryItems: number; inventoryValueAgorot: number; lowStock: number }[];
    totals: { employees: number; shifts: number; laborAgorot: number; inventoryValueAgorot: number; lowStock: number };
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/venue/admin/venues");
    if (res.status === 401) { router.push("/venue/admin"); return; }
    const data = await res.json();
    setVenues(data.venues ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/venue/admin/operations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setOps(d))
      .catch(() => {});
  }, []);

  async function openVenue(v: VenueRow) {
    setDrawerLoading(true);
    setSelectedVenue(null);
    const res = await fetch(`/api/venue/admin/venue-detail?id=${v.id}`);
    const data = await res.json();
    setSelectedVenue(data.venue ?? null);
    setDrawerLoading(false);
  }

  const totals = {
    events: venues.reduce((s, v) => s + v._count.events, 0),
    reservations: venues.reduce((s, v) => s + v._count.reservations, 0),
    transactions: venues.reduce((s, v) => s + v._count.transactions, 0),
  };

  return (
    <div dir="rtl" className="min-h-screen crm-container flex" style={{ background: "#06060A" }}>
      {/* Sidebar */}
      <aside className="w-64 sticky top-0 h-screen bg-bg-soft border-l border-line flex flex-col shrink-0">
        <div className="p-6 border-b border-line">
          <div className="font-display text-xl text-gold-gradient tracking-widest mb-0.5">CLUBBING</div>
          <div className="text-[10px] text-ink-dim tracking-[0.3em] uppercase">Platform Admin</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<Building2 className="w-4 h-4" />} label="מועדונים ו-CRMs" active />
          <NavItem icon={<TrendingUp className="w-4 h-4" />} label="סטטיסטיקות כלליות" />
          <NavItem icon={<Users className="w-4 h-4" />} label="כל המשתמשים" />
        </nav>
        <div className="p-4 border-t border-line">
          <button onClick={async () => { await fetch("/api/venue/admin/login", { method: "DELETE" }); router.push("/venue/admin"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-danger hover:bg-danger/5 transition-colors">
            <LogOut className="w-4 h-4" /> יציאה
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="crm-page-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-gold-gradient">ניהול פלטפורמה</h1>
            <p className="text-sm text-ink-muted mt-1">{venues.length} CRMs פעילים</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 rounded-lg border border-line hover:border-gold/30 text-ink-muted hover:text-gold transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowVip(true)}
              className="h-10 px-5 flex items-center gap-2 text-sm font-semibold rounded-xl border border-gold/40 text-gold hover:bg-gold/10 transition-colors">
              <Crown className="w-4 h-4" /> הוסף חבר VIP
            </button>
            <button onClick={() => setShowCreate(true)}
              className="btn-gold h-10 px-5 flex items-center gap-2 text-sm font-semibold">
              <Plus className="w-4 h-4" /> הוסף CRM חדש
            </button>
          </div>
        </div>

        <div className="crm-page-body space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "מועדונים פעילים", val: venues.length, icon: <Building2 className="w-5 h-5" />, color: "text-gold" },
              { label: "אירועים כולל", val: totals.events, icon: <Calendar className="w-5 h-5" />, color: "text-blue-400" },
              { label: "הזמנות כולל", val: totals.reservations, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-400" },
              { label: "עסקאות כולל", val: totals.transactions, icon: <Users className="w-5 h-5" />, color: "text-purple-400" },
            ].map((k) => (
              <div key={k.label} className="stat-card">
                <div className={`${k.color} mb-3`}>{k.icon}</div>
                <div className="text-2xl font-display text-ink">{k.val}</div>
                <div className="text-xs text-ink-muted mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Operations summary (shifts + warehouse) across all venues */}
          {ops && (
            <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-line flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-ink">תפעול · משמרות ומחסן</h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-ink-muted">עלות שכר שבועית: <span className="text-gold font-semibold">₪{(ops.totals.laborAgorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 })}</span></span>
                  <span className="text-ink-muted">שווי מלאי: <span className="text-gold font-semibold">₪{(ops.totals.inventoryValueAgorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 })}</span></span>
                  {ops.totals.lowStock > 0 && <span className="text-danger font-semibold">{ops.totals.lowStock} התראות מלאי</span>}
                </div>
              </div>
              <table className="crm-table w-full">
                <thead>
                  <tr>
                    <th>מועדון</th>
                    <th>עובדים</th>
                    <th>משמרות השבוע</th>
                    <th>עלות שכר</th>
                    <th>פריטי מלאי</th>
                    <th>שווי מלאי</th>
                    <th>התראות</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.rows.map((r) => (
                    <tr key={r.venueId}>
                      <td className="font-medium text-ink">{r.name}</td>
                      <td>{r.employees}</td>
                      <td>{r.shifts}</td>
                      <td>₪{(r.laborAgorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 })}</td>
                      <td>{r.inventoryItems}</td>
                      <td>₪{(r.inventoryValueAgorot / 100).toLocaleString("he-IL", { maximumFractionDigits: 0 })}</td>
                      <td>{r.lowStock > 0 ? <span className="text-danger font-semibold">{r.lowStock}</span> : <span className="text-ink-dim">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Venues table */}
          <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-semibold text-ink">כל ה-CRMs</h2>
              <span className="text-xs text-ink-muted">{venues.length} מועדונים</span>
            </div>
            {loading ? (
              <div className="p-12 text-center text-ink-muted">טוען...</div>
            ) : (
              <table className="crm-table w-full">
                <thead>
                  <tr>
                    <th>שם המועדון</th>
                    <th>SUBDOMAIN</th>
                    <th>אירועים</th>
                    <th>הזמנות</th>
                    <th>חברים</th>
                    <th>ביקורות</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map((v) => (
                    <tr key={v.id} className="cursor-pointer hover:bg-gold/5 transition-colors"
                      onClick={() => openVenue(v)}>
                      <td>
                        <div className="flex items-center gap-3">
                          {v.logoUrl ? (
                            <img src={v.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gold/20 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                              <span className="text-gold text-sm font-bold">{v.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-ink">{v.name}</div>
                            <div className="text-xs text-ink-muted">{v.city}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <a href={`https://${v.slug}.clubbing.co.il/venue`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-gold hover:underline">
                          <Globe className="w-3 h-3" /> {v.slug}.clubbing.co.il
                        </a>
                      </td>
                      <td><span className="font-medium">{v._count.events}</span></td>
                      <td><span className="font-medium">{v._count.reservations}</span></td>
                      <td><span className="font-medium">{v._count.transactions}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold fill-gold" />
                          <span className="font-medium">{v._count.reviews}</span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openVenue(v)}
                            className="p-1.5 rounded hover:bg-gold/10 text-ink-muted hover:text-gold transition-colors" title="צפה בפרטים">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => window.open(`https://${v.slug}.clubbing.co.il/venue`, "_blank")}
                            className="p-1.5 rounded hover:bg-gold/10 text-ink-muted hover:text-gold transition-colors" title="פתח CRM">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button onClick={() => setResetVenue(v)}
                            className="p-1.5 rounded hover:bg-blue-500/10 text-ink-muted hover:text-blue-400 transition-colors" title="איפוס סיסמה">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Venue Detail Drawer */}
      {(selectedVenue || drawerLoading) && (
        <VenueDrawer
          venue={selectedVenue}
          loading={drawerLoading}
          onClose={() => { setSelectedVenue(null); setDrawerLoading(false); }}
          onResetPassword={(v) => { setResetVenue(v as VenueRow); }}
        />
      )}

      {/* Add VIP Modal */}
      {showVip && <AddVipModal venues={venues} onClose={() => setShowVip(false)} />}

      {/* Create CRM Modal */}
      {showCreate && <CreateVenueModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}

      {/* Reset Password Modal */}
      {resetVenue && <ResetPasswordModal venue={resetVenue} onClose={() => setResetVenue(null)} onDone={() => setResetVenue(null)} />}
    </div>
  );
}

// ── Venue Detail Drawer ─────────────────────────────────────────────────────
function VenueDrawer({ venue, loading, onClose, onResetPassword }: {
  venue: VenueDetail | null; loading: boolean;
  onClose: () => void; onResetPassword: (v: VenueDetail) => void;
}) {
  function statusIcon(s: string) {
    if (s === "confirmed" || s === "active") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (s === "cancelled") return <XCircle className="w-3.5 h-3.5 text-danger" />;
    return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  }

  return (
    <div className="fixed inset-0 z-40 flex" dir="rtl">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] h-full bg-bg-card border-r border-line flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line sticky top-0 bg-bg-card z-10">
          <button onClick={onClose} className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> חזור
          </button>
          {venue && (
            <a href={`https://${venue.slug}.clubbing.co.il/venue`} target="_blank" rel="noreferrer"
              className="btn-gold h-8 px-4 flex items-center gap-2 text-xs font-semibold">
              <ExternalLink className="w-3 h-3" /> פתח CRM
            </a>
          )}
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center text-ink-muted">טוען פרטים...</div>
        )}

        {venue && !loading && (
          <div className="p-6 space-y-6">
            {/* Venue identity */}
            <div className="flex items-center gap-4">
              {venue.logoUrl ? (
                <img src={venue.logoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gold/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-gold text-2xl font-bold">
                  {venue.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-display text-ink">{venue.name}</h2>
                <p className="text-sm text-ink-muted">{venue.city} · {venue.address}</p>
                <a href={`https://${venue.slug}.clubbing.co.il/venue`} target="_blank" rel="noreferrer"
                  className="text-xs text-gold hover:underline flex items-center gap-1 mt-1">
                  <Globe className="w-3 h-3" /> {venue.slug}.clubbing.co.il
                </a>
              </div>
            </div>

            {/* Access info */}
            <div className="bg-bg-elevated rounded-xl p-4 border border-line space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">פרטי גישה</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">שם משתמש</span>
                <span className="text-sm font-mono text-gold bg-gold/10 px-2 py-0.5 rounded">{venue.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">סיסמה</span>
                <button onClick={() => onResetPassword(venue)}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> איפוס סיסמה
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "אירועים", val: venue._count.events, color: "text-blue-400" },
                { label: "הזמנות", val: venue._count.reservations, color: "text-emerald-400" },
                { label: "עסקאות", val: venue._count.transactions, color: "text-purple-400" },
                { label: "ביקורות", val: venue._count.reviews, color: "text-gold" },
              ].map((s) => (
                <div key={s.label} className="bg-bg-elevated rounded-xl p-4 border border-line text-center">
                  <div className={`text-2xl font-display ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-ink-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent events */}
            {venue.events.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">אירועים אחרונים</p>
                <div className="space-y-2">
                  {venue.events.map((e) => (
                    <div key={e.id} className="flex items-center justify-between bg-bg-elevated rounded-lg px-4 py-3 border border-line">
                      <div className="flex items-center gap-2 min-w-0">
                        {statusIcon(e.status)}
                        <span className="text-sm text-ink truncate">{e.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(e.startsAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                        </span>
                        {e.basePriceAgorot > 0 && (
                          <span className="text-xs text-gold">₪{(e.basePriceAgorot / 100).toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reservations */}
            {venue.reservations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">הזמנות אחרונות</p>
                <div className="space-y-2">
                  {venue.reservations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-bg-elevated rounded-lg px-4 py-3 border border-line">
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="text-sm text-ink">{r.guestName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-muted">{r.quantity} אורחים</span>
                        <span className="text-xs text-ink-dim">
                          {new Date(r.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a href={`https://${venue.slug}.clubbing.co.il/venue/events`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-line text-sm text-ink-muted hover:text-gold hover:border-gold/30 transition-colors">
                <Calendar className="w-4 h-4" /> אירועים
              </a>
              <a href={`https://${venue.slug}.clubbing.co.il/venue/reservations`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-line text-sm text-ink-muted hover:text-gold hover:border-gold/30 transition-colors">
                <Users className="w-4 h-4" /> הזמנות
              </a>
              <a href={`https://${venue.slug}.clubbing.co.il/venue/customers`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-line text-sm text-ink-muted hover:text-gold hover:border-gold/30 transition-colors">
                <Star className="w-4 h-4" /> לקוחות
              </a>
              <a href={`https://${venue.slug}.clubbing.co.il/venue/live`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-line text-sm text-ink-muted hover:text-gold hover:border-gold/30 transition-colors">
                <TrendingUp className="w-4 h-4" /> לייב
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Venue Modal ──────────────────────────────────────────────────────
function CreateVenueModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", slug: "", username: "", password: "", logoUrl: "", city: "", address: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/admin/venues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) onCreated();
    else setError(data.error ?? "שגיאה");
  }

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" dir="rtl">
      <div className="w-full max-w-lg bg-bg-card border border-gold/20 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">יצירת CRM חדש</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="שם המועדון / מסעדה" placeholder="מרפסת מלה" value={form.name} onChange={upd("name")} required />
            <Field label="Subdomain (תחת clubbing.co.il)" placeholder="mirpeset" value={form.slug} onChange={upd("slug")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="עיר" placeholder="רמת ישי" value={form.city} onChange={upd("city")} />
            <Field label="כתובת" placeholder="רחוב הפרחים 1" value={form.address} onChange={upd("address")} />
          </div>
          <Field label="URL לוגו" placeholder="https://..." value={form.logoUrl} onChange={upd("logoUrl")} />
          <div className="border-t border-line pt-4 space-y-4">
            <p className="text-xs text-ink-muted font-medium">פרטי גישה ל-CRM</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="שם משתמש" placeholder="mirpeset" value={form.username} onChange={upd("username")} required />
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">סיסמה</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={upd("password")} required placeholder="••••••••"
                    className="input w-full pl-8" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-dim">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {form.slug && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20 text-xs">
              <Globe className="w-3 h-3 text-gold" />
              <span className="text-ink-muted">כתובת CRM:</span>
              <span className="text-gold font-medium">https://{form.slug}.clubbing.co.il/venue</span>
            </div>
          )}
          {error && <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-line text-sm text-ink-muted hover:text-ink transition-colors">ביטול</button>
            <button disabled={loading} className="flex-1 btn-gold h-10 text-sm font-semibold">
              {loading ? "יוצר..." : "צור CRM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────────
function ResetPasswordModal({ venue, onClose, onDone }: { venue: VenueRow; onClose: () => void; onDone: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/venue/admin/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId: venue.id, newPassword }),
    });
    setLoading(false);
    setDone(true);
    setTimeout(onDone, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" dir="rtl">
      <div className="w-full max-w-sm bg-bg-card border border-gold/20 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">איפוס סיסמה</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-ink-muted mb-4">איפוס סיסמה עבור <span className="text-ink font-medium">{venue.name}</span></p>
        {done ? (
          <div className="text-center py-4 text-emerald-400 font-medium">✓ הסיסמה עודכנה בהצלחה</div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input w-full pl-8" placeholder="סיסמה חדשה" required minLength={6} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-dim">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-line text-sm text-ink-muted">ביטול</button>
              <button disabled={loading} className="flex-1 btn-gold h-10 text-sm font-semibold">
                {loading ? "מעדכן..." : "עדכן סיסמה"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${active ? "bg-gold/10 text-gold border border-gold/20" : "text-ink-muted hover:text-ink hover:bg-bg-elevated"}`}>
      {icon}{label}
    </div>
  );
}

function Field({ label, placeholder, value, onChange, required }: {
  label: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="input w-full" required={required} />
    </div>
  );
}

// ── Add VIP Modal ────────────────────────────────────────────────────────────
function AddVipModal({ venues, onClose }: { venues: VenueRow[]; onClose: () => void }) {
  const [form, setForm] = useState({ email: "", name: "", venueId: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/venue/admin/add-vip", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) setDone(true);
    else setError(data.error ?? "שגיאה");
  }

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" dir="rtl">
      <div className="w-full max-w-md bg-bg-card border border-gold/30 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
              <Crown className="w-4 h-4 text-gold" />
            </div>
            <h2 className="text-lg font-semibold text-ink">הוספת חבר VIP</h2>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        {done ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mx-auto">
              <Crown className="w-7 h-7 text-gold" />
            </div>
            <p className="text-lg font-semibold text-ink">VIP נוסף בהצלחה!</p>
            <p className="text-sm text-ink-muted">{form.name || form.email} עוצב/ה כחבר/ת VIP</p>
            <button onClick={onClose} className="btn-gold h-10 px-8 text-sm font-semibold mt-2">סגור</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-xs text-gold flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 shrink-0" />
              חבר VIP מקבל גישה מיוחדת, תג זהב ומעמד בכירים בכל ה-CRM
            </div>
            <Field label="כתובת מייל *" placeholder="vip@example.com" value={form.email} onChange={upd("email")} required />
            <Field label="שם מלא" placeholder="ישראל ישראלי" value={form.name} onChange={upd("name")} />
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">שייך למועדון (אופציונלי)</label>
              <select value={form.venueId} onChange={upd("venueId")}
                className="input w-full">
                <option value="">— כל הפלטפורמה —</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">הערה פנימית</label>
              <textarea value={form.note} onChange={upd("note")} rows={2}
                placeholder="הסיבה למעמד VIP..."
                className="input w-full resize-none" />
            </div>
            {error && <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-line text-sm text-ink-muted hover:text-ink transition-colors">ביטול</button>
              <button disabled={loading}
                className="flex-1 h-10 rounded-xl bg-gold text-bg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gold/90 transition-colors disabled:opacity-50">
                <Crown className="w-4 h-4" />
                {loading ? "מוסיף..." : "הוסף VIP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
