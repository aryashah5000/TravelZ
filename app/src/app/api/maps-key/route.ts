// API route that returns a Google Maps API key for client-side map integration.
// If no key is configured via the `GOOGLE_MAPS_KEY` environment variable, an
// empty string is returned. The key itself should never be hardcoded into
// client-side code; using this endpoint allows the frontend to request it
// dynamically when rendering maps.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Safely expose only the key, not other env vars.
  const key = process.env.GOOGLE_MAPS_KEY || '';
  return NextResponse.json({ key });
}