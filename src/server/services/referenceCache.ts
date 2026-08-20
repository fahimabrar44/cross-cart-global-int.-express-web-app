interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const clone = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return Array.isArray(value) ? ([...value] as unknown as T) : value;
  }
};

/**
 * Run `loader` and memoize its result for `ttlMs`, keyed by `key`.
 * Returns a defensive clone so callers can't mutate the cached value.
 * Use `invalidReferenceData(prefix)` after any write to the same collection.
 */
export async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return clone<T>(hit.value as T);
  }
  const value = await loader();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return clone<T>(value);
}

/** Drop every cached entry whose key starts with `prefix` (e.g. "countrys"). */
export function invalidateReferenceData(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearReferenceCache(): void {
  store.clear();
}