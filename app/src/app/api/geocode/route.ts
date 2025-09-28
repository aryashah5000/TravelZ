export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple server-side geocoding proxy. Accepts a query string `q` and
 * forwards the request to the OpenStreetMap Nominatim API. This avoids
 * client-side CORS issues and hides API keys (none needed for Nominatim).
 *
 * Usage: /api/geocode?q=Atlanta
 * Returns: { lat: number, lng: number } on success or { error: string }
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    if (!q) {
      return NextResponse.json({ error: 'q required' }, { status: 400 });
    }
    const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const res = await fetch(searchUrl, {
      headers: {
        // Provide a UA string per Nominatim usage policy
        'User-Agent': 'hotel-lens-api/1.0 (+https://github.com/hotel-lens)'
      }
    });
    if (!res.ok) {
      return NextResponse.json({ error: `geocode failed: ${res.status}` }, { status: res.status });
    }
    const list: any = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({ error: 'no results' }, { status: 404 });
    }
    const first = list[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: 'invalid results' }, { status: 422 });
    }
    return NextResponse.json({ lat, lng });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'geocode error' }, { status: 500 });
  }
}