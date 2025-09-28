import { Hotel, SearchParams } from '@/types';


export interface HotelProvider {
    name: string;
    searchNearby(params: SearchParams): Promise<Hotel[]>;
}


export function parseMinAgeFromText(text?: string | null): number | null {
    if (!text) return null;
    const t = text.toLowerCase();
    // Expand patterns to catch more phrasing variations such as
    // "minimum check-in age is 18", "you must be at least 21 years old",
    // "guests under 21 are not allowed", "18+", etc. We search for
    // one or two-digit numbers associated with age requirements. After matching,
    // we filter out implausible ages (e.g., below 16 or above 30) to avoid
    // picking up numbers unrelated to check-in policies (like years in addresses).
    // Regular expressions capturing various ways hotels describe check‑in age requirements.
    // We deliberately keep the numeric range small (<16 or >30) to avoid false positives.
    const patterns: RegExp[] = [
        // "minimum check in age is 18", "minimum check‑in age: 18"
        /minimum\s*(?:check[- ]?in\s*)?age[^0-9]{0,12}(\d{1,2})/,
        // "check in age requirement is 21"
        /check[- ]?in\s*age[^0-9]{0,12}(\d{1,2})/,
        // "minimum age to check in is 18"
        /minimum\s*age\s*(?:to|for)\s*check[- ]?in[^0-9]{0,12}(\d{1,2})/,
        // "check in age requirement"
        /check[- ]?in\s*age\s*requirement[^0-9]{0,12}(\d{1,2})/,
        // "minimum guest age"
        /minimum\s*guest\s*age[^0-9]{0,12}(\d{1,2})/,
        // "age restriction: 21"
        /age\s*restriction[^0-9]{0,12}(\d{1,2})/,
        // statements like "guests must be at least 18 years old", "guests are 21 or older"
        /guests?\s*(?:must\s*(?:be|are)|have\s*to\s*be|are\s*required\s*to\s*be|are)\s*(?:at\s*least\s*)?(\d{1,2})(?:\s*years)?\s*(?:or\s*older)?/,
        // generic forms: "must be 18 years of age", "must be 21+"
        /(?:must\s*(?:be|are)|are)\s*(?:at\s*least\s*)?(\d{1,2})\s*(?:years?\s*(?:of\s*age|old|or\s*older)?|\+\s*(?:years)?|\+)/,
        // "guests under 21 are not allowed"
        /guests?\s*under\s*(\d{1,2})\s*are\s*not\s*allowed/,
        // stand‑alone age mentions like "18+", "21+"
        /(\d{1,2})\s*\+\s*(?:years)?/,
        // "21 years or older"
        /(\d{1,2})\s*years?\s*or\s*older/,
        // "21 years of age"
        /(\d{1,2})\s*years\s*of\s*age/,
        // "21 years old"
        /(\d{1,2})\s*years?\s*old/
    ];
    for (const pat of patterns) {
        const m = t.match(pat);
        if (m) {
            const numStr = m[1];
            if (!numStr) continue;
            const n = parseInt(numStr, 10);
            if (!isNaN(n)) {
                // Skip implausible ages to avoid false positives (e.g., addresses, years)
                if (n < 16 || n > 30) continue;
                return n;
            }
        }
    }
    return null;
}