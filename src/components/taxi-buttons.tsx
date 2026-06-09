"use client";

import { useEffect, useState } from "react";

interface Props {
  venueLat?: number;
  venueLng?: number;
  venueName: string;
  mode?: "to-venue" | "home";
}

export function TaxiButtons({ venueLat, venueLng, venueName, mode = "to-venue" }: Props) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 4000 }
    );
  }, []);

  if (!venueLat || !venueLng) return null;

  const labels = {
    "to-venue": "למועדון",
    home: "הביתה",
  };

  const gettUrl =
    mode === "to-venue" && origin
      ? `https://www.gett.com/order?pickup_lat=${origin.lat}&pickup_lng=${origin.lng}&destination_lat=${venueLat}&destination_lng=${venueLng}`
      : `https://www.gett.com/order?pickup_lat=${venueLat}&pickup_lng=${venueLng}`;

  const yangoUrl =
    mode === "to-venue" && origin
      ? `https://yango.com/route/?start-lat=${origin.lat}&start-lng=${origin.lng}&end-lat=${venueLat}&end-lng=${venueLng}`
      : `https://yango.com/route/?start-lat=${venueLat}&start-lng=${venueLng}`;

  return (
    <div className="card-elevated p-4">
      <div className="text-sm text-ink-muted mb-3">
        🚖 הזמן מונית {labels[mode]} · {venueName}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={gettUrl} target="_blank" rel="noreferrer" className="btn-ghost h-11 text-sm">
          🚖 Gett
        </a>
        <a href={yangoUrl} target="_blank" rel="noreferrer" className="btn-ghost h-11 text-sm">
          🚖 Yango
        </a>
      </div>
    </div>
  );
}

export function RideHomeCard({
  venueLat,
  venueLng,
  venueName,
}: Pick<Props, "venueLat" | "venueLng" | "venueName">) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">🌙</div>
        <div className="flex-1">
          <div className="font-semibold text-ink">הסעה הביתה</div>
          <div className="text-xs text-ink-muted">
            הזמן עם לחיצה — היעד נבחר באפליקציה
          </div>
        </div>
      </div>
      <TaxiButtons
        venueLat={venueLat}
        venueLng={venueLng}
        venueName={venueName}
        mode="home"
      />
    </div>
  );
}
