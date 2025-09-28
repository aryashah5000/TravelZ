// API route to fetch events for a given city using the Ticketmaster Discovery API.
// This mirrors the functionality provided in the server.js example from the
// TravelZ-Itinerary_Function package. It accepts a `city` query parameter
// and returns a list of simplified event objects. If no API key is set or
// the fetch fails, an empty list is returned with a 200 status code.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Extract the `city` query param. Default to an empty string.
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '';
  const apiKey = process.env.TICKETMASTER_API_KEY;

  // If no API key is configured, return an empty array. This avoids
  // exposing API keys in the client and allows the UI to handle the
  // absence of events gracefully.
  if (!apiKey) {
    return NextResponse.json({ events: [] });
  }

  try {
    // Construct the Ticketmaster API URL. Encode the city for safety.
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(
      city,
    )}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Ticketmaster API returned ${res.status}`);
    }
    const data = await res.json();
    // Map through the events to extract only the needed fields. When
    // optional fields are missing, provide sensible defaults.
    const events = ((data._embedded && data._embedded.events) || []).map((e: any) => ({
      name: e.name,
      venue:
        (e._embedded && e._embedded.venues && e._embedded.venues[0]?.name) || '',
      date: e.dates?.start?.localDate || '',
    }));
    return NextResponse.json({ events });
  } catch (err: any) {
    // Log error server-side; return empty list on failure to avoid breaking UI.
    console.error('Error fetching Ticketmaster events:', err);
    return NextResponse.json({ events: [] });
  }
}