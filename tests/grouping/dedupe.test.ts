import { describe, it, expect } from "vitest";
import { deduplicateTracks } from "@/lib/grouping/dedupe";
import { makeTrack } from "./fixtures";

describe("deduplicateTracks", () => {
  it("keeps unique tracks unchanged", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "b", uri: "spotify:track:b" }),
    ];
    expect(deduplicateTracks(tracks)).toHaveLength(2);
  });

  it("removes duplicate URIs, keeping first occurrence", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "First" }),
      makeTrack({ id: "b", uri: "spotify:track:a", name: "Duplicate" }),
      makeTrack({ id: "c", uri: "spotify:track:b" }),
    ];
    const result = deduplicateTracks(tracks);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("First");
  });

  it("preserves ordering of first occurrences", () => {
    const tracks = [
      makeTrack({ id: "c", uri: "spotify:track:c" }),
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "b", uri: "spotify:track:b" }),
    ];
    const result = deduplicateTracks(tracks);
    expect(result.map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("handles empty array", () => {
    expect(deduplicateTracks([])).toEqual([]);
  });

  it("handles all duplicates", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "a", uri: "spotify:track:a" }),
      makeTrack({ id: "a", uri: "spotify:track:a" }),
    ];
    expect(deduplicateTracks(tracks)).toHaveLength(1);
  });
});
