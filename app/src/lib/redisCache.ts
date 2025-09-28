import type { Redis } from 'ioredis';

// This module provides a simple wrapper around Redis for caching values.
// It gracefully falls back to in-memory LRU caches when Redis is not
// configured (i.e. when REDIS_URL is undefined). The goal is to make
// switching between Redis-backed and in-memory caches as simple as
// checking one environment variable.

// Dynamically require ioredis so that the app still bundles without it
// when Redis is not used. When REDIS_URL is provided, a client is
// created; otherwise all methods fall back to the provided in-memory
// caches.

let redisClient: Redis | null = null;
const redisUrl = process.env.REDIS_URL;
// We require ioredis only if a URL is provided. This avoids pulling
// in the module when not needed (e.g., in a browser bundle).
if (redisUrl) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RedisLib = require('ioredis');
        redisClient = new RedisLib(redisUrl);
        redisClient.on('error', (err: any) => {
            console.warn('Redis error:', err?.message || err);
        });
    } catch (e) {
        console.warn('Failed to initialize Redis:', e?.toString?.() || e);
        redisClient = null;
    }
}

// Fallback LRU caches. These are used when Redis is not available.
import { LRU } from './lru';
const fallbackPolicyCache = new LRU<string, string | null>(1000, 24 * 60 * 60_000); // 24h TTL
const fallbackSearchCache = new LRU<string, any>(200, 60 * 60_000); // 1h TTL

// Helper to determine if we should use Redis
function hasRedis(): boolean {
    return !!redisClient;
}

/**
 * Get a value from cache. If Redis is configured, it is preferred.
 * @param key The cache key
 */
export async function getCache<T>(key: string): Promise<T | undefined> {
    if (redisClient) {
        try {
            const val = await redisClient.get(key);
            if (val == null) return undefined;
            return JSON.parse(val) as T;
        } catch (e) {
            console.warn('Redis get error:', e?.toString?.() || e);
        }
    }
    // fallback to in-memory
    return (fallbackSearchCache.get(key) ?? undefined) as unknown as T;
}

/**
 * Set a value in cache with a TTL (in seconds). If Redis is configured, it is
 * used; otherwise falls back to the in-memory cache. Values are stringified.
 * @param key The cache key
 * @param value The value to cache
 * @param ttlSec TTL in seconds
 */
export async function setCache<T>(key: string, value: T, ttlSec: number): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.set(key, JSON.stringify(value), 'EX', ttlSec);
            return;
        } catch (e) {
            console.warn('Redis set error:', e?.toString?.() || e);
        }
    }
    // fallback to in-memory
    fallbackSearchCache.set(key, value, ttlSec * 1000);
}

/**
 * Specialized helper to get cached policy text. Separate helper is used so
 * that policy caches can be isolated from search caches when falling back
 * to the LRU implementation. Returns undefined if not cached.
 */
export async function getCachedPolicy(url: string): Promise<string | null | undefined> {
    if (redisClient) {
        try {
            const key = `policy:${url}`;
            const val = await redisClient.get(key);
            if (val == null) return undefined;
            // policies are stored as strings (can be null)
            return JSON.parse(val) as string | null;
        } catch (e) {
            console.warn('Redis policy get error:', e?.toString?.() || e);
        }
    }
    // fallback to LRU
    return fallbackPolicyCache.get(url);
}

/**
 * Store policy text (string or null) in cache. TTL is in seconds. When
 * Redis is enabled, keys are prefixed with 'policy:'. Otherwise the LRU
 * fallback cache is used.
 */
export async function setCachedPolicy(url: string, policy: string | null, ttlSec: number): Promise<void> {
    if (redisClient) {
        try {
            const key = `policy:${url}`;
            await redisClient.set(key, JSON.stringify(policy), 'EX', ttlSec);
            return;
        } catch (e) {
            console.warn('Redis policy set error:', e?.toString?.() || e);
        }
    }
    // fallback to LRU
    fallbackPolicyCache.set(url, policy, ttlSec * 1000);
}

/**
 * Attempt to get cached search results. Search keys are namespaced with
 * provider, coordinates, radius, and limit. TTL is controlled by the
 * caller when setting the cache. Returns undefined if not present.
 */
export async function getCachedSearch<T>(key: string): Promise<T | undefined> {
    if (redisClient) {
        try {
            const val = await redisClient.get(key);
            if (val == null) return undefined;
            return JSON.parse(val) as T;
        } catch (e) {
            console.warn('Redis search get error:', e?.toString?.() || e);
        }
    }
    return (fallbackSearchCache.get(key) ?? undefined) as T;
}

/**
 * Store search results in cache with the given TTL (seconds). When Redis
 * is available, keys are stored exactly as provided. Otherwise LRU
 * fallback is used.
 */
export async function setCachedSearch<T>(key: string, value: T, ttlSec: number): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.set(key, JSON.stringify(value), 'EX', ttlSec);
            return;
        } catch (e) {
            console.warn('Redis search set error:', e?.toString?.() || e);
        }
    }
    fallbackSearchCache.set(key, value, ttlSec * 1000);
}