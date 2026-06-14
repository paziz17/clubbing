import { NextResponse } from "next/server";

// Server-side proxy to Google Geolocation API
// Keeps the API key secret and provides accurate location
export async function POST() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ considerIp: true }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    // data = { location: { lat, lng }, accuracy }
    return NextResponse.json({
      lat: data.location.lat,
      lng: data.location.lng,
      accuracy: data.accuracy,
      source: "google",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
