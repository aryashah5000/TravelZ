export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_PROVIDER } from '@/lib/config';
import { MockProvider } from '@/lib/providers/mock';
// providers are required lazily to capture import-time errors in dev
import { LRU } from '@/lib/lru';
import { getCachedSearch, setCachedSearch } from '@/lib/redisCache';
import { Hotel, SearchParams, SearchResponse } from '../../../../types';
import type { HotelProvider } from '@/lib/providers/base';


const cache = new LRU<string, Hotel[]>(200, 5 * 60_000); // 5 min fallback cache


function pickProvider() {
    try {
        switch (ACTIVE_PROVIDER) {
            case 'expedia':
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require('@/lib/providers/expedia').ExpediaProvider;
            case 'booking':
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require('@/lib/providers/booking').BookingProvider;
            default:
                return MockProvider;
        }
    } catch (e) {
        try {
            const fs = require('fs');
            const path = require('path');
            const debugDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            const file = path.join(debugDir, `provider-import-error-${Date.now()}.log`);
            const eany: any = e;
            fs.writeFileSync(file, `${eany?.stack || eany?.message || String(eany)}`, 'utf8');
        } catch (we) { /* ignore */ }
        return MockProvider;
    }
}


export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const lat = parseFloat(url.searchParams.get('lat') || 'NaN');
        const lng = parseFloat(url.searchParams.get('lng') || 'NaN');
        const radiusKm = parseFloat(url.searchParams.get('radius') || '20');
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return NextResponse.json({ error: 'lat,lng required' }, { status: 400 });
        }


        const key = `${ACTIVE_PROVIDER}:${lat.toFixed(4)},${lng.toFixed(4)}:${radiusKm}:${limit}`;
        // Check Redis cache first
        let hit: Hotel[] | undefined = undefined;
        try {
            hit = await getCachedSearch<Hotel[]>(`api:${key}`);
        } catch { /* ignore */ }
        if (!hit) {
            hit = cache.get(key);
        }
        const provider = pickProvider();
        let hotels: Hotel[] | undefined;
        try {
            // If we have a cache hit, use it. Otherwise call the active provider.
            hotels = hit ?? await provider.searchNearby({ lat, lng, radiusKm, limit } as SearchParams);
        } catch (provErr: any) {
            // write error to disk for inspection
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const fs = require('fs');
                const path = require('path');
                const debugDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
                const file = path.join(debugDir, `api-search-error-${Date.now()}.log`);
                const payload = `provider=${provider.name} error=${provErr?.stack || provErr?.message || provErr}\n`;
                fs.writeFileSync(file, payload, 'utf8');
            } catch (writeErr) {
                // ignore write errors
            }
            // Fallback: try the mock provider if the active provider fails (e.g., network issues).
            try {
                const fallback = require('@/lib/providers/mock').MockProvider as HotelProvider;
                hotels = await fallback.searchNearby({ lat, lng, radiusKm, limit } as SearchParams);
            } catch {
                // If even the mock fails, rethrow original error
                throw provErr;
            }
        }

        // If the provider returned no results (e.g., due to scraping failure), attempt a fallback to the mock provider.
        if (!hotels || hotels.length === 0) {
            try {
                const fallback = require('@/lib/providers/mock').MockProvider as HotelProvider;
                const mockResults = await fallback.searchNearby({ lat, lng, radiusKm, limit } as SearchParams);
                if (mockResults && mockResults.length > 0) {
                    hotels = mockResults;
                }
            } catch {
                // ignore fallback errors; we'll just return the empty array
            }
        }
        hotels = hotels ?? [];
        if (!hit) {
            // Save into caches: Redis (5 min) and fallback
            try {
                await setCachedSearch<Hotel[]>(`api:${key}`, hotels, 5 * 60);
            } catch { /* ignore */ }
            cache.set(key, hotels);
        }


        const eligible: Hotel[] = [];
        const unknown: Hotel[] = [];
        const notEligible: Hotel[] = [];
    for (const h of hotels) {
            if (h.minCheckInAge == null) unknown.push(h);
            else if (h.minCheckInAge <= 18) eligible.push(h);
            else notEligible.push(h);
        }


        const res: SearchResponse = {
            eligible, unknown, notEligible,
            meta: { provider: provider.name, fetchedAt: new Date().toISOString() }
        };
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
    }
}