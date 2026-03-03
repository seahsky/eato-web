import { get, set, del, clear } from 'idb-keyval'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/** Store a value in IndexedDB with a timestamp */
export async function cacheSet<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() }
  await set(key, entry)
}

/** Get a value from IndexedDB, returns null if not found */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = await get<CacheEntry<T>>(key)
  return entry?.data ?? null
}

/** Check if a cache entry exists and is fresher than maxAgeMs */
export async function cacheIsFresh(key: string, maxAgeMs: number): Promise<boolean> {
  const entry = await get<CacheEntry<unknown>>(key)
  if (!entry) return false
  return Date.now() - entry.timestamp < maxAgeMs
}

/** Delete a specific key */
export async function cacheDelete(key: string): Promise<void> {
  await del(key)
}

/** Clear all cache entries */
export async function cacheClearAll(): Promise<void> {
  await clear()
}

// Composable for cache-first data fetching pattern
export function useCache() {
  return { cacheSet, cacheGet, cacheIsFresh, cacheDelete, cacheClearAll }
}
