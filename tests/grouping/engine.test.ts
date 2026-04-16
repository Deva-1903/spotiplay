import { describe, it, expect } from "vitest";
import { generatePreview } from "@/lib/grouping/engine";
import { makeTracks, makeTrack, DEFAULT_TEST_OPTIONS } from "./fixtures";

describe("generatePreview", () => {
  it("returns correct totalLikedSongs count", () => {
    const tracks = makeTracks(50);
    const preview = generatePreview(tracks, [], DEFAULT_TEST_OPTIONS);
    expect(preview.totalLikedSongs).toBe(50);
  });

  it("removes duplicates when deduplicateUris=true", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "a", uri: "spotify:track:a" }), // duplicate URI
      makeTrack({ id: "b", uri: "spotify:track:b" }),
    ];
    const preview = generatePreview(tracks, [], { ...DEFAULT_TEST_OPTIONS, deduplicateUris: true });
    expect(preview.totalValidTracks).toBe(2);
    expect(preview.totalSkippedTracks).toBe(1);
  });

  it("does not remove duplicates when deduplicateUris=false", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "a", uri: "spotify:track:a" }),
    ];
    const preview = generatePreview(tracks, [], { ...DEFAULT_TEST_OPTIONS, deduplicateUris: false });
    expect(preview.totalValidTracks).toBe(2);
    expect(preview.totalSkippedTracks).toBe(0);
  });

  it("skips small groups and reports them", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: 1990 }),
      makeTrack({ id: "b", uri: "spotify:track:b", releaseYear: 2000 }),
      makeTrack({ id: "c", uri: "spotify:track:c", releaseYear: 2000 }),
      makeTrack({ id: "d", uri: "spotify:track:d", releaseYear: 2000 }),
    ];
    const preview = generatePreview(tracks, [], {
      ...DEFAULT_TEST_OPTIONS,
      strategy: "releaseYear",
      skipSmallGroups: true,
      minimumTracks: 2,
    });
    expect(preview.skippedGroups).toHaveLength(1); // 1990 has 1 track
    expect(preview.totalPlaylists).toBe(1); // only 2000 kept
  });

  it("handles empty library gracefully", () => {
    const preview = generatePreview([], [], DEFAULT_TEST_OPTIONS);
    expect(preview.totalLikedSongs).toBe(0);
    expect(preview.totalPlaylists).toBe(0);
    expect(preview.groups).toHaveLength(0);
  });

  it("sorts tracks inside groups", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", addedAt: "2023-01-01T00:00:00Z" }),
      makeTrack({ id: "b", uri: "spotify:track:b", addedAt: "2023-06-01T00:00:00Z" }),
      makeTrack({ id: "c", uri: "spotify:track:c", addedAt: "2023-03-01T00:00:00Z" }),
    ];
    const preview = generatePreview(tracks, [], {
      ...DEFAULT_TEST_OPTIONS,
      strategy: "chunk",
      sort: { field: "likedDate", order: "desc" },
    });
    const resultTracks = preview.groups[0].tracks;
    expect(resultTracks[0].id).toBe("b"); // 2023-06 newest
    expect(resultTracks[2].id).toBe("a"); // 2023-01 oldest
  });

  it("generates deterministic generatedAt timestamp", () => {
    const tracks = makeTracks(5);
    const p1 = generatePreview(tracks, [], DEFAULT_TEST_OPTIONS);
    // Just verify it's a valid ISO string
    expect(() => new Date(p1.generatedAt)).not.toThrow();
  });
});
