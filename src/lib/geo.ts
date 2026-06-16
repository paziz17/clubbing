import { distanceKm } from "@/lib/utils";

/**
 * Offline location resolution for Israel.
 *
 * Reverse geocoding (lat/lng -> city) via Google requires the Geocoding API to
 * be enabled on the project, which it is not. To make location detection work
 * reliably everywhere (and instantly, with no network round-trip) we map a
 * coordinate to the nearest known area centroid. The area ids line up 1:1 with
 * the discover-wizard `AREAS` and `AREA_CITIES`, so the result plugs straight
 * into the existing filtering.
 */

export interface AreaCentroid {
  id: string;
  /** Canonical Hebrew city/area label shown to the user. */
  label: string;
  lat: number;
  lng: number;
}

export const AREA_CENTROIDS: AreaCentroid[] = [
  { id: "tel-aviv",  label: "תל אביב",     lat: 32.0853, lng: 34.7818 },
  { id: "gush-dan",  label: "גוש דן",      lat: 32.0823, lng: 34.8113 },
  { id: "rishon",    label: "ראשון לציון", lat: 31.9730, lng: 34.8066 },
  { id: "jerusalem", label: "ירושלים",     lat: 31.7683, lng: 35.2137 },
  { id: "haifa",     label: "חיפה",        lat: 32.7940, lng: 34.9896 },
  { id: "sharon",    label: "השרון",       lat: 32.2200, lng: 34.8800 },
  { id: "south",     label: "דרום",        lat: 31.8000, lng: 34.6500 },
  { id: "beersheva", label: "באר שבע",     lat: 31.2518, lng: 34.7913 },
  { id: "eilat",     label: "אילת",        lat: 29.5577, lng: 34.9519 },
];

/** Rough bounding box of Israel — used to sanity-check IP-based coordinates. */
export function isInIsrael(lat: number, lng: number): boolean {
  return lat >= 29.3 && lat <= 33.5 && lng >= 34.2 && lng <= 35.95;
}

export interface ResolvedArea {
  areaId: string;
  label: string;
  km: number;
}

/** Nearest known area to the given coordinate (always returns something). */
export function nearestArea(lat: number, lng: number): ResolvedArea {
  let best = AREA_CENTROIDS[0];
  let bestKm = Infinity;
  for (const a of AREA_CENTROIDS) {
    const km = distanceKm({ lat, lng }, { lat: a.lat, lng: a.lng });
    if (km < bestKm) {
      bestKm = km;
      best = a;
    }
  }
  return { areaId: best.id, label: best.label, km: Math.round(bestKm * 10) / 10 };
}
