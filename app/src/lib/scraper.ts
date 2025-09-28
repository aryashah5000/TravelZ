import { extractMinAgeFromEmbeddedJSON, parseMinAgeFromText } from './scraper-json';

// Use global fetch when available (Node 18+). Fall back to node-fetch only if needed.
let _fetch: typeof fetch | undefined = undefined as any;
if (typeof globalThis.fetch === 'function') {
    _fetch = globalThis.fetch;
} else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _fetch = require('node-fetch');
}
const cheerio = require('cheerio');
// only import fs/path when debugging to avoid bundling overhead
let _fs: typeof import('fs/promises') | null = null;
let _path: typeof import('path') | null = null;
if (process.env.DEBUG_SCRAPER) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _fs = require('fs').promises;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _path = require('path');
}
type CheerioElement = any;

/**
 * Fetches the given url and returns text content.
 * Note: caller should handle timeouts/retries in production.
 */
export async function fetchHtml(url: string): Promise<string | null> {
    try {
        if (!_fetch) return null;
        const fn = _fetch as unknown as (input: string, init?: any) => Promise<any>;
        // small timeout to avoid hanging requests. Use env SCRAPER_TIMEOUT_MS if provided.
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        let timeoutMs = 10_000;
        try {
            const envVal = process.env.SCRAPER_TIMEOUT_MS;
            if (envVal) {
                const parsed = parseInt(envVal, 10);
                if (!Number.isNaN(parsed) && parsed > 0) timeoutMs = parsed;
            }
        } catch { /* ignore parse errors */ }
        const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) hotel-lens-scraper/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url
        };
        const res = await fn(url, { headers, redirect: 'follow', signal: controller?.signal });
        const text = await res.text();
        if (timeout) clearTimeout(timeout);
        // debug: write fetched HTML to disk for inspection
        if (process.env.DEBUG_SCRAPER && _fs && _path) {
            try {
                const debugDir = _path.join(process.cwd(), 'tmp', 'scraper-debug');
                await _fs.mkdir(debugDir, { recursive: true });
                const safeName = url.replace(/[^a-z0-9]/gi, '_').slice(0, 120);
                const fileName = `${Date.now()}_${safeName}.html`;
                const filePath = _path.join(debugDir, fileName);
                await _fs.writeFile(filePath, text, 'utf8');
                console.warn(`scraper: wrote debug HTML to ${filePath}`);
            } catch (we) {
                console.warn('scraper: failed to write debug HTML', we);
            }
        }
        if (!res || !res.ok) {
            if (process.env.DEBUG_SCRAPER) console.warn(`fetchHtml: non-ok response ${res?.status} for ${url} (len=${text?.length || 0})`);
            // return the text anyway for debugging/parsing — caller can decide to discard
            // but if this looks like a challenge/waf page, try a headless browser fallback
            const challengeMarkers = ['AwsWafIntegration', 'JavaScript is disabled', 'verify that you\'re not a robot', 'challenge.js'];
            if (challengeMarkers.some(m => text && text.includes(m))) {
                if (process.env.DEBUG_SCRAPER) console.warn('fetchHtml: detected challenge page, attempting Playwright fallback');
                try {
                    // lazy-require to avoid adding dependency unless used
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { fetchWithPlaywright } = require('./playwrightFetcher');
                    const pwHtml = await fetchWithPlaywright(url, { blockHeavy: true, timeout: 20000, retries: 3, waitAfterLoadMs: 500 });
                    if (pwHtml) return pwHtml;
                } catch (e) {
                    if (process.env.DEBUG_SCRAPER) console.warn('fetchHtml: playwright fallback failed', e?.toString?.() || e);
                }
            }
            return text;
        }
        // Also check for WAF/challenge markers even on 200 responses and attempt a Playwright fallback
        try {
            const challengeMarkers = ['AwsWafIntegration', 'JavaScript is disabled', 'verify that you\'re not a robot', 'challenge.js', 'document.location.reload'];
            if (text && challengeMarkers.some(m => text.includes(m))) {
                if (process.env.DEBUG_SCRAPER) console.warn('fetchHtml: detected challenge markers on ok response, attempting Playwright fallback');
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { fetchWithPlaywright } = require('./playwrightFetcher');
                    const pwHtml = await fetchWithPlaywright(url, { timeout: 20000, retries: 3, waitAfterLoadMs: 500 });
                    if (pwHtml) return pwHtml;
                } catch (e) {
                    if (process.env.DEBUG_SCRAPER) console.warn('fetchHtml: playwright fallback failed (ok-response path)', e?.toString?.() || e);
                }
            }
        } catch (e) { /* ignore */ }
        return text;
    } catch (e) {
        if (process.env.DEBUG_SCRAPER) console.warn('fetchHtml: error', e?.toString?.() || e);
        return null;
    }
}

/**
 * Attempts to extract likely check-in policy text (or surrounding text) from a hotel's page.
 * This is intentionally conservative: we return a chunk of text that can be passed to the
 * existing `parseMinAgeFromText` helper.
 */
export function extractPolicyTextFromHtml(html: string): string | null {
    /**
     * Attempt to extract a snippet of text describing the property's check‑in policies.
     *
     * Booking and Expedia present their policies in a variety of locations (sections,
     * divs, paragraphs, list items) and with different casing ("Check-in", "check in",
     * "Policies", etc.). The previous implementation used Cheerio's :contains selector
     * with hard‑coded, case‑sensitive strings, which missed many legitimate matches.
     *
     * This new implementation iterates through several common tags and performs a
     * case‑insensitive text search for "policy" or "check‑in" on their contents. It
     * returns the first reasonably long match. If nothing is found, it falls back to
     * truncating the full body text. Errors are swallowed and result in a null
     * return value.
     */
    try {
        const $ = cheerio.load(html);
        const candidates: string[] = [];
        // tags to inspect for policy text. We include span and li to catch edge cases.
        const tags = ['section', 'div', 'p', 'li', 'span'];
        tags.forEach(tag => {
            $(tag).each((_: number, el: any) => {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                if (!text) return;
                // Check for the words "policy" or "check in" / "check-in" in a case‑insensitive manner
                if (/policy/i.test(text) || /check\s*-?\s*in/i.test(text)) {
                    candidates.push(text);
                }
            });
        });
        for (const c of candidates) {
            // require a minimum length to avoid spurious matches on navigation items
            if (c.length > 10) {
                return c;
            }
        }
        // fallback: return the first 200 chars of the full body text to allow the caller
        // to attempt regex extraction on a broader context. Normalize whitespace first.
        const body = $('body').text().replace(/\s+/g, ' ').trim();
        if (body.length > 50) return body.slice(0, 200);
        return null;
    } catch {
        return null;
    }
}

export async function scrapePolicyTextFromUrl(url: string): Promise<string | null> {
    const raw: string | null = await fetchHtml(url);
    if (!raw) return null;           // bail early (now html can be string)
    let html: string = raw; 

    const j = extractMinAgeFromEmbeddedJSON(html);
    if (j.minAge != null) {
        // Return a tiny policy string you can display or parse upstream
        return `Minimum age to check-in: ${j.minAge}`;
    }

    let txt = extractPolicyTextFromHtml(html);

    // heuristics: if extracted text is missing or looks like JS/challenge, try Playwright
    const looksChallenge = (s: string | null) => !s || /awswafintegration|verify.*robot|challenge\.js|settimeout\(/i.test(s);
    if (looksChallenge(txt)) {
        try {
            const { fetchWithPlaywright } = require('./playwrightFetcher');

            html = await fetchWithPlaywright(url, {
                timeoutMs: 20000,
                retries: 2,
                waitFor: {
                    selector: url.includes('booking.com')
                        ? '[data-testid="house-rules-section"], [data-component="hotel/Policies"], #important_information, #hp_hotel_name'
                        : '[data-stid*="property-section-policies"], [data-stid="content-hotel-title"]',
                },
                blockHeavy: true
            }) || html;

            const j2 = extractMinAgeFromEmbeddedJSON(html);
            if (j2.minAge != null) return `Minimum age to check-in: ${j2.minAge}`;

            txt = extractPolicyTextFromHtml(html);
        } catch { }
    }

    // 4) As a last step, try to parse a number from the final text
    let age = parseMinAgeFromText(txt || '');
    if (age != null) return `Minimum age to check-in: ${age}`;

    // 5) Fallback: search the entire page text for an age requirement. Some sites
    // bury the minimum check-in age deep in the house rules or fine print
    // sections that aren't captured by our heuristics above. To avoid missing
    // these, extract the full body text (normalized to single spaces) and run
    // the min‑age regex across it. If found, return a concise string.
    try {
        const $all = cheerio.load(html);
        const bodyText = $all('body').text().replace(/\s+/g, ' ').trim();
        age = parseMinAgeFromText(bodyText);
        if (age != null) return `Minimum age to check-in: ${age}`;
    } catch {
        // ignore parse errors; fall through
    }

    // If we still haven't found an age, return the extracted snippet (may be null).
    return txt;
}

/**
 * Extracts one or more image URLs from a hotel property HTML page. This looks for
 * Open Graph metadata (og:image/twitter:image) as a primary source and falls
 * back to the first <img> tag on the page if no meta tags are found. Because
 * different providers structure their pages differently, the heuristics are
 * intentionally broad. Returned URLs are not guaranteed to be absolute — it is
 * the caller’s responsibility to resolve relative URLs if needed.
 */
export function extractImageUrlsFromHtml(html: string): string[] {
    try {
        const $ = cheerio.load(html);
        const urls: string[] = [];
        // Gather Open Graph or Twitter card images first
        $('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]').each((_: number, el: any) => {
            const url = $(el).attr('content');
            if (url && !urls.includes(url)) urls.push(url);
        });
        // Fall back to first image on the page if no meta images found
        if (urls.length === 0) {
            $('img').each((_: number, el: any) => {
                const attribs = el.attribs || {};
                const src = attribs['src'] || attribs['data-src'] || attribs['data-lazy-src'] || attribs['data-lazy'] || attribs['data-lazy-img'];
                if (src) {
                    urls.push(src);
                    return false; // break after first image
                }
            });
        }
        return urls;
    } catch {
        return [];
    }
}

/**
 * Convenience wrapper around fetchHtml that returns image URLs from a property page.
 * If the page cannot be fetched, an empty array is returned. This function does
 * not attempt Playwright fallbacks; callers should handle that separately if
 * needed. Relative URLs are returned as-is.
 */
export async function scrapeImageUrlsFromUrl(url: string): Promise<string[]> {
    // Optionally disable image scraping via env flags. If IMAGE_SCRAPE_ENABLED or NEXT_PUBLIC_IMAGE_SCRAPE_ENABLED
    // is explicitly set to 'false' (case-insensitive), skip scraping and return an empty array. This allows
    // developers to turn off image scraping in resource‑constrained or offline environments.
    try {
        const flag = process.env.IMAGE_SCRAPE_ENABLED || process.env.NEXT_PUBLIC_IMAGE_SCRAPE_ENABLED;
        if (typeof flag === 'string' && flag.toLowerCase() === 'false') {
            return [];
        }
    } catch { /* ignore */ }
    const html = await fetchHtml(url);
    if (!html) return [];
    const rawUrls = extractImageUrlsFromHtml(html);
    // Convert any relative URLs to absolute based on the page URL. Some providers
    // return images like "/images/foo.jpg" which will break when rendered in the
    // client. Using the URL constructor ensures correct resolution even when the
    // base URL contains query parameters or hashes. If resolution fails (e.g. the
    // URL is malformed), fall back to returning the raw string.
    return rawUrls.map(u => {
        try {
            return new URL(u, url).toString();
        } catch {
            return u;
        }
    });
}

// --- Domain-specific search scrapers -------------------------------------------------
import { LRU } from './lru';
import { getCachedPolicy, setCachedPolicy, getCachedSearch, setCachedSearch } from './redisCache';
import { URL } from 'url';

export interface PropertySummary {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    url: string;
    address?: string;
}

const searchCache = new LRU<string, PropertySummary[]>(200, 60_000 * 60); // in-memory fallback: 1h
const policyCache = new LRU<string, string | null>(1000, 24 * 60 * 60_000); // in-memory fallback: 24h

const domainLastRequest: Record<string, number> = {};
const MIN_REQUEST_INTERVAL = 400; // ms between requests per domain

async function rateLimitFor(url: string) {
    try {
        const u = new URL(url);
        const host = u.hostname;
        const last = domainLastRequest[host] || 0;
        const delta = Date.now() - last;
        if (delta < MIN_REQUEST_INTERVAL) await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - delta));
        domainLastRequest[host] = Date.now();
    } catch (e) {
        // ignore
    }
}

function absoluteUrl(base: string, href: string) {
    try { return new URL(href, base).toString(); } catch (e) { return href; }
}

export async function searchBookingByCoords(lat: number, lng: number, radiusKm = 20, limit = 50): Promise<PropertySummary[]> {
    const key = `booking:${lat.toFixed(4)},${lng.toFixed(4)}:${radiusKm}:${limit}`;
    // Try Redis first
    const redisHit = await getCachedSearch<PropertySummary[]>(key);
    if (redisHit) return redisHit;
    // fall back to in-memory
    const hit = searchCache.get(key);
    if (hit) return hit;

    // Construct a Booking search URL. Booking's public search page accepts latitude/longitude.
    const url = `https://www.booking.com/searchresults.html?ss=&latitude=${lat}&longitude=${lng}&radius=${Math.round(radiusKm)}`;
    await rateLimitFor(url);
    const html = await fetchHtml(url);
    if (!html) return [];
    const $ = cheerio.load(html);

    const props: PropertySummary[] = [];
    // Heuristic: find links that look like property links (contain "/hotel/") or have data-testid
    $('a').each((i: number, el: CheerioElement) => {
        try {
            const href = $(el).attr('href');
            if (!href) return;
            // booking property links often contain "/hotel/" or "/hotel/us/"
            if (!/hotel\//i.test(href)) return;
            const name = $(el).text().trim() || $(el).attr('title') || '';
            if (!name) return;
            const full = absoluteUrl(url, href.split('?')[0]);
            // try to extract coords from parent data attributes
            const parent = $(el).closest('[data-coords], [data-latitude], [data-lat]');
            let plat: number | null = null; let plng: number | null = null;
            if (parent && parent.length) {
                const latAttr = parent.attr('data-lat') || parent.attr('data-latitude') || parent.attr('data-coords-lat');
                const lngAttr = parent.attr('data-lng') || parent.attr('data-longitude') || parent.attr('data-coords-lng');
                if (latAttr && lngAttr) { plat = parseFloat(latAttr); plng = parseFloat(lngAttr); }
            }
            // fallback: parse lat/lon from href query params if present
            if ((plat == null || plng == null) && href.includes('latitude=')) {
                try {
                    const q = new URL('https://booking.com' + href, 'https://booking.com');
                    const la = q.searchParams.get('latitude');
                    const ln = q.searchParams.get('longitude');
                    if (la && ln) { plat = parseFloat(la); plng = parseFloat(ln); }
                } catch (e) { /* ignore */ }
            }

            const id = full;
            props.push({ id, name, lat: plat, lng: plng, url: full });
        } catch (e) { /* ignore */ }
    });

    // Additional heuristics: Booking's markup often uses data-testid on title links. Attempt to capture these
    // links even if they don't include "/hotel/" in the href. We merge with the above results.
    $('a[data-testid="title-link"], a[data-testid="title"], a[data-test-id="title-link"]').each((i: number, el: CheerioElement) => {
        try {
            const href = $(el).attr('href');
            if (!href) return;
            const full = absoluteUrl(url, href.split('?')[0]);
            // Skip if we've already captured this link
            if (props.find(p => p.id === full)) return;
            const name = $(el).text().trim() || $(el).attr('title') || '';
            if (!name) return;
            // Attempt to extract coords from parent attributes, but allow null
            const parent = $(el).closest('[data-coords], [data-latitude], [data-lat]');
            let plat: number | null = null; let plng: number | null = null;
            if (parent && parent.length) {
                const latAttr = parent.attr('data-lat') || parent.attr('data-latitude') || parent.attr('data-coords-lat');
                const lngAttr = parent.attr('data-lng') || parent.attr('data-longitude') || parent.attr('data-coords-lng');
                if (latAttr && lngAttr) {
                    plat = parseFloat(latAttr);
                    plng = parseFloat(lngAttr);
                }
            }
            const id = full;
            props.push({ id, name, lat: plat, lng: plng, url: full });
        } catch (e) { /* ignore */ }
    });

    const uniq = props.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx).slice(0, limit);
    if (process.env.DEBUG_SCRAPER) console.warn(`searchBookingByCoords: parsed ${props.length} anchors, returning ${uniq.length} items for ${url}`);
    if (uniq.length === 0) {
        // attempt Playwright-assisted fetch and re-parse — this helps when Booking serves a JS challenge
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { fetchWithPlaywright } = require('./playwrightFetcher');
            const pwHtml = await fetchWithPlaywright(url, { timeout: 20000, retries: 3, waitAfterLoadMs: 600 });
            if (pwHtml) {
                const $pw = cheerio.load(pwHtml);
                const propsPw: PropertySummary[] = [];
                $pw('a').each((i: number, el: CheerioElement) => {
                    try {
                        const href = $pw(el).attr('href');
                        if (!href) return;
                        if (!/hotel\//i.test(href)) return;
                        const name = $pw(el).text().trim() || $pw(el).attr('title') || '';
                        if (!name) return;
                        const full = absoluteUrl(url, href.split('?')[0]);
                        const id = full;
                        propsPw.push({ id, name, lat: null, lng: null, url: full });
                    } catch (e) { /* ignore */ }
                });
                const uniqPw = propsPw.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx).slice(0, limit);
                if (uniqPw.length > 0) {
                    if (process.env.DEBUG_SCRAPER) console.warn(`searchBookingByCoords: Playwright parse returned ${uniqPw.length} items for ${url}`);
                    searchCache.set(key, uniqPw);
                    return uniqPw;
                }
            }
        } catch (e) {
            if (process.env.DEBUG_SCRAPER) console.warn('searchBookingByCoords: Playwright re-parse failed', e?.toString?.() || e);
        }
    }
    // Store result in caches: Redis and in-memory. TTL: 1 hour (3600 seconds)
    await setCachedSearch(key, uniq, 3600);
    searchCache.set(key, uniq);
    return uniq;
}

export async function searchExpediaByCoords(lat: number, lng: number, radiusKm = 20, limit = 50): Promise<PropertySummary[]> {
    const key = `expedia:${lat.toFixed(4)},${lng.toFixed(4)}:${radiusKm}:${limit}`;
    // Try Redis first
    const redisHit = await getCachedSearch<PropertySummary[]>(key);
    if (redisHit) return redisHit;
    const hit = searchCache.get(key);
    if (hit) return hit;

    const url = `https://www.expedia.com/Hotel-Search?lat=${lat}&lng=${lng}&radius=${Math.round(radiusKm)}`;
    await rateLimitFor(url);
    const html = await fetchHtml(url);
    if (!html) return [];
    const $ = cheerio.load(html);

    const props: PropertySummary[] = [];
    // Heuristic: property links often contain "/Hotel_Review-" or "/Hotel-"
    $('a').each((i: number, el: CheerioElement) => {
        try {
            const href = $(el).attr('href');
            if (!href) return;
            if (!/(Hotel_Review|Hotel-)/i.test(href)) return;
            const name = $(el).text().trim() || $(el).attr('aria-label') || '';
            if (!name) return;
            const full = absoluteUrl(url, href.split('?')[0]);
            // try to find coords in parent data attributes
            const parent = $(el).closest('[data-latitude], [data-lat]');
            let plat: number | null = null; let plng: number | null = null;
            if (parent && parent.length) {
                const latAttr = parent.attr('data-lat') || parent.attr('data-latitude');
                const lngAttr = parent.attr('data-lng') || parent.attr('data-longitude');
                if (latAttr && lngAttr) { plat = parseFloat(latAttr); plng = parseFloat(lngAttr); }
            }
            // fallback: parse lat/lng from query params
            if ((plat == null || plng == null) && href.includes('latitude=')) {
                try {
                    const q = new URL(full);
                    const la = q.searchParams.get('latitude');
                    const ln = q.searchParams.get('longitude');
                    if (la && ln) { plat = parseFloat(la); plng = parseFloat(ln); }
                } catch (e) { /* ignore */ }
            }
            const id = full;
            props.push({ id, name, lat: plat, lng: plng, url: full });
        } catch (e) { /* ignore */ }
    });

    const uniq = props.filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx).slice(0, limit);
    if (process.env.DEBUG_SCRAPER) console.warn(`searchExpediaByCoords: parsed ${props.length} anchors, returning ${uniq.length} items for ${url}`);
    await setCachedSearch(key, uniq, 3600);
    searchCache.set(key, uniq);
    return uniq;
}

export async function cachedScrapePolicy(url: string): Promise<string | null> {
    // Attempt Redis cache first
    const redisHit = await getCachedPolicy(url);
    if (redisHit !== undefined) return redisHit;
    // Fall back to in-memory
    const hit = policyCache.get(url);
    if (hit !== undefined) return hit;
    await rateLimitFor(url);
    const txt = await scrapePolicyTextFromUrl(url);
    // Persist in caches: Redis (24h TTL) and in-memory
    await setCachedPolicy(url, txt, 24 * 60 * 60);
    policyCache.set(url, txt);
    return txt;
}
