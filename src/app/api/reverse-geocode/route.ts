import { NextRequest, NextResponse } from "next/server";
import { nearestArea, isInIsrael } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Cache-Control": "no-store",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Reverse geocode lat/lng -> { city, areaId, label }.
 *
 * Strategy (first that succeeds wins for the human-readable city name):
 *   1. Google Geocoding API   (only if GOOGLE_MAPS_API_KEY + API enabled)
 *   2. OpenStreetMap Nominatim (free, keyless)
 *
 * The area bucket (`areaId`) is ALWAYS resolved locally from centroids so the
 * result is usable for filtering even when both external services are down.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400, headers: CORS });
  }

  // Local area bucket — instant and always available.
  const area = nearestArea(lat, lng);
  let city: string | null = null;
  let source = "centroid";

  // Only bother with external lookups for coordinates inside Israel.
  if (isInIsrael(lat, lng)) {
    city = await googleCity(lat, lng);
    if (city) source = "google";
    if (!city) {
      city = await nominatimCity(lat, lng);
      if (city) source = "nominatim";
    }
  }

  return NextResponse.json(
    {
      city: city ?? area.label,
      areaId: area.areaId,
      areaLabel: area.label,
      km: area.km,
      inIsrael: isInIsrael(lat, lng),
      source,
    },
    { headers: CORS },
  );
}

async function googleCity(lat: number, lng: number): Promise<string | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${lng}&language=he&result_type=locality&key=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    const locality = data.results[0].address_components?.find(
      (c: { types: string[]; long_name: string }) => c.types.includes("locality"),
    );
    return locality?.long_name ?? data.results[0].address_components?.[0]?.long_name ?? null;
  } catch {
    return null;
  }
}

async function nominatimCity(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=he&zoom=10`;
    const r = await fetch(url, {
      headers: { "User-Agent": "ClubbingApp/1.0 (https://clubbing.co.il)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
  } catch {
    return null;
  }
}
