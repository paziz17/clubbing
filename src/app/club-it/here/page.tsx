"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { TaxiButtons } from "@/components/taxi-buttons";

interface Venue {
  id: string;
  name: string;
  city: string;
  km: number;
  activeBuddies: number;
  lat?: number;
  lng?: number;
}

export default function HerePage() {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ buddies: number; credits: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("הדפדפן לא תומך במיקום");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("נדרשת הרשאה למיקום"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!loc) return;
    fetch(`/api/venue/nearby?lat=${loc.lat}&lng=${loc.lng}`)
      .then((r) => r.json())
      .then((d) => setVenues(d.venues));
  }, [loc]);

  async function checkIn() {
    if (!selected || !loc) return;
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId: selected, lat: loc.lat, lng: loc.lng }),
    });
    const data = await res.json();
    setChecked({ buddies: data.buddyCount, credits: data.creditsEarned });
  }

  if (checked) {
    return (
      <div className="mobile-screen p-6 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-6xl mb-4">📍</div>
        <h1 className="font-display text-2xl text-gold mb-3">צ׳ק־אין הושלם</h1>
        <p className="text-ink-muted mb-6">
          {checked.buddies > 0
            ? `${checked.buddies} בליינים נוספים כאן עכשיו!`
            : "אתה הראשון כאן הלילה"}
        </p>
        {checked.credits > 0 && (
          <div className="card-elevated p-5 w-full max-w-xs mb-6 border border-gold/40">
            <div className="text-xs text-ink-muted mb-1">צברת</div>
            <div className="font-display text-3xl text-gold">+{checked.credits} קרדיטים</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mobile-screen pb-10">
      <div className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl text-gold mb-1">אני כאן · Bump</h1>
        <p className="text-sm text-ink-muted">צ׳ק־אין במועדון וקבל/י קרדיטים על חברים נוספים</p>
      </div>

      {error && <p className="px-5 text-danger text-sm">{error}</p>}
      {!loc && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          מאתר מיקום...
        </div>
      )}

      <div className="px-5 space-y-2">
        {venues.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.id)}
            className={`w-full p-4 rounded-xl border text-right transition-all ${
              selected === v.id
                ? "border-gold bg-gold/10"
                : "border-line bg-bg-card hover:border-gold/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold" />
                <div className="text-right">
                  <div className="font-semibold text-ink">{v.name}</div>
                  <div className="text-xs text-ink-muted">{v.city} · {v.km} ק״מ</div>
                </div>
              </div>
              {v.activeBuddies > 0 && (
                <span className="chip-gold text-[10px]">
                  🔴 {v.activeBuddies} כאן עכשיו
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed bottom-0 right-0 left-0 z-30 glass border-t border-line p-4 max-w-md mx-auto">
          <button onClick={checkIn} className="btn-gold w-full h-12">
            אני כאן · צ׳ק־אין ←
          </button>
        </div>
      )}
    </div>
  );
}
