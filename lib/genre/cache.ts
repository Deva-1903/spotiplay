import type { GenreClassification } from "./types";

/**
 * Bump this version whenever the classification logic changes significantly.
 * A version change invalidates all cached results.
 */
export const CLASSIFIER_VERSION = "1";

const cache = new Map<string, GenreClassification>();

/**
 * Build the cache key for a track.
 * Key = CLASSIFIER_VERSION:trackId:sortedNormalizedGenres
 */
export function buildCacheKey(trackId: string, artistGenres: string[]): string {
  const sortedGenres = [...artistGenres].sort().join("|");
  return `${CLASSIFIER_VERSION}:${trackId}:${sortedGenres}`;
}

export function getCached(key: string): GenreClassification | undefined {
  return cache.get(key);
}

export function setCached(key: string, classification: GenreClassification): void {
  cache.set(key, classification);
}

/** For testing: clear all cached entries */
export function clearCache(): void {
  cache.clear();
}

/** For testing: inspect cache size */
export function cacheSize(): number {
  return cache.size;
}
