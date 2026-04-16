import { describe, it, expect, beforeEach } from "vitest";
import {
  buildCacheKey,
  getCached,
  setCached,
  clearCache,
  cacheSize,
  CLASSIFIER_VERSION,
} from "@/lib/genre/cache";
import type { GenreClassification } from "@/lib/genre/types";

const MOCK_CLASSIFICATION: GenreClassification = {
  primaryGenre: "Pop",
  secondaryGenres: [],
  confidence: 0.9,
  source: "rules",
  rationale: "Test",
  signals: {
    normalizedArtistGenres: ["pop"],
    titleKeywords: [],
    albumKeywords: [],
    candidateScores: [{ genre: "Pop", score: 0.9 }],
  },
};

describe("cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("starts empty after clearCache", () => {
    expect(cacheSize()).toBe(0);
  });

  it("returns undefined for a cache miss", () => {
    expect(getCached("nonexistent-key")).toBeUndefined();
  });

  it("stores and retrieves a classification", () => {
    const key = buildCacheKey("track-1", ["pop"]);
    setCached(key, MOCK_CLASSIFICATION);
    expect(getCached(key)).toEqual(MOCK_CLASSIFICATION);
  });

  it("buildCacheKey includes CLASSIFIER_VERSION", () => {
    const key = buildCacheKey("track-1", ["pop"]);
    expect(key).toContain(CLASSIFIER_VERSION);
  });

  it("buildCacheKey includes trackId", () => {
    const key = buildCacheKey("abc-123", ["pop"]);
    expect(key).toContain("abc-123");
  });

  it("buildCacheKey sorts genres for stability", () => {
    const key1 = buildCacheKey("t1", ["pop", "rock"]);
    const key2 = buildCacheKey("t1", ["rock", "pop"]);
    expect(key1).toBe(key2);
  });

  it("different trackIds produce different keys", () => {
    const key1 = buildCacheKey("t1", ["pop"]);
    const key2 = buildCacheKey("t2", ["pop"]);
    expect(key1).not.toBe(key2);
  });

  it("different genre sets produce different keys", () => {
    const key1 = buildCacheKey("t1", ["pop"]);
    const key2 = buildCacheKey("t1", ["rock"]);
    expect(key1).not.toBe(key2);
  });

  it("increments cache size on set", () => {
    setCached(buildCacheKey("t1", ["pop"]), MOCK_CLASSIFICATION);
    setCached(buildCacheKey("t2", ["rock"]), MOCK_CLASSIFICATION);
    expect(cacheSize()).toBe(2);
  });
});
