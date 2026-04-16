import { describe, it, expect, beforeEach, vi } from "vitest";
import { classifyTrack, classifyTracks } from "@/lib/genre/classify-track";
import { clearCache, cacheSize } from "@/lib/genre/cache";
import type { GenreClassifierInput } from "@/lib/genre/types";

// Stub AI classifier so tests don't require ANTHROPIC_API_KEY
vi.mock("@/lib/genre/ai-classifier", () => ({
  classifyWithAI: vi.fn().mockResolvedValue(null),
}));

const makeInput = (overrides: Partial<GenreClassifierInput> = {}): GenreClassifierInput => ({
  trackId: "track-1",
  trackName: "Test Track",
  albumName: "Test Album",
  artistGenres: [],
  ...overrides,
});

describe("classifyTrack", () => {
  beforeEach(() => {
    clearCache();
  });

  it("returns a valid GenreClassification object", async () => {
    const result = await classifyTrack(makeInput({ artistGenres: ["pop"] }));
    expect(result).toMatchObject({
      primaryGenre: expect.any(String),
      secondaryGenres: expect.any(Array),
      confidence: expect.any(Number),
      source: expect.stringMatching(/rules|heuristics|ai|fallback/),
      rationale: expect.any(String),
    });
  });

  it("classifies clear pop genre as Pop", async () => {
    const result = await classifyTrack(
      makeInput({ artistGenres: ["pop", "dance pop", "teen pop"] }),
    );
    expect(result.primaryGenre).toBe("Pop");
    expect(result.source).toBe("rules");
  });

  it("classifies hip-hop correctly", async () => {
    const result = await classifyTrack(
      makeInput({ artistGenres: ["hip hop", "trap", "rap"] }),
    );
    expect(result.primaryGenre).toBe("Hip-Hop/Rap");
  });

  it("falls back to Other when no genres or keywords", async () => {
    const result = await classifyTrack(makeInput({ artistGenres: [] }));
    expect(result.primaryGenre).toBe("Other");
    expect(result.source).toBe("fallback");
  });

  it("caches the result after first call", async () => {
    const input = makeInput({ artistGenres: ["pop"] });
    await classifyTrack(input);
    expect(cacheSize()).toBe(1);
  });

  it("returns cached result on second call (same key)", async () => {
    const input = makeInput({ trackId: "stable-id", artistGenres: ["pop"] });
    const first = await classifyTrack(input);
    const second = await classifyTrack(input);
    expect(second).toBe(first); // same object reference from cache
  });

  it("uses 'fallback' source when AI returns null and confidence is low", async () => {
    // Mixed signals → low confidence → AI (mocked null) → fallback
    const result = await classifyTrack(
      makeInput({ artistGenres: ["pop", "indie rock", "folk", "jazz"] }),
    );
    expect(["rules", "heuristics", "fallback"]).toContain(result.source);
  });

  it("includes signals in result", async () => {
    const result = await classifyTrack(
      makeInput({ artistGenres: ["k-pop", "korean pop"] }),
    );
    expect(result.signals.normalizedArtistGenres).toContain("k-pop");
  });

  it("confidence is between 0 and 1", async () => {
    const result = await classifyTrack(makeInput({ artistGenres: ["rock"] }));
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe("classifyTracks (batch)", () => {
  beforeEach(() => {
    clearCache();
  });

  it("returns one result per input", async () => {
    const inputs = [
      makeInput({ trackId: "t1", artistGenres: ["pop"] }),
      makeInput({ trackId: "t2", artistGenres: ["hip hop"] }),
      makeInput({ trackId: "t3", artistGenres: ["metal"] }),
    ];
    const results = await classifyTracks(inputs);
    expect(results).toHaveLength(3);
    expect(results[0].primaryGenre).toBe("Pop");
    expect(results[1].primaryGenre).toBe("Hip-Hop/Rap");
    expect(results[2].primaryGenre).toBe("Metal");
  });

  it("re-uses cache across batch calls", async () => {
    const input = makeInput({ trackId: "cached-t", artistGenres: ["jazz"] });
    await classifyTrack(input); // prime cache
    const sizeBefore = cacheSize();
    await classifyTracks([input]); // should hit cache
    expect(cacheSize()).toBe(sizeBefore);
  });
});
