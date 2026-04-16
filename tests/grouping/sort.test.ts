import { describe, it, expect } from "vitest";
import { sortTracks } from "@/lib/grouping/sort";
import { makeTrack } from "./fixtures";

describe("sortTracks", () => {
  it("sorts by likedDate desc", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", addedAt: "2023-01-01T00:00:00Z" }),
      makeTrack({ id: "b", uri: "spotify:track:b", addedAt: "2023-06-01T00:00:00Z" }),
      makeTrack({ id: "c", uri: "spotify:track:c", addedAt: "2023-03-01T00:00:00Z" }),
    ];
    const sorted = sortTracks(tracks, { field: "likedDate", order: "desc" });
    expect(sorted.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by likedDate asc", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", addedAt: "2023-01-01T00:00:00Z" }),
      makeTrack({ id: "b", uri: "spotify:track:b", addedAt: "2023-06-01T00:00:00Z" }),
    ];
    const sorted = sortTracks(tracks, { field: "likedDate", order: "asc" });
    expect(sorted[0].id).toBe("a");
  });

  it("sorts by trackName asc (case insensitive)", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "Zebra" }),
      makeTrack({ id: "b", uri: "spotify:track:b", name: "apple" }),
      makeTrack({ id: "c", uri: "spotify:track:c", name: "Mango" }),
    ];
    const sorted = sortTracks(tracks, { field: "trackName", order: "asc" });
    expect(sorted.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by artistName", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", primaryArtist: "Radiohead" }),
      makeTrack({ id: "b", uri: "spotify:track:b", primaryArtist: "Arcade Fire" }),
      makeTrack({ id: "c", uri: "spotify:track:c", primaryArtist: "Beck" }),
    ];
    const sorted = sortTracks(tracks, { field: "artistName", order: "asc" });
    expect(sorted[0].id).toBe("b"); // Arcade Fire
    expect(sorted[1].id).toBe("c"); // Beck
    expect(sorted[2].id).toBe("a"); // Radiohead
  });

  it("does not mutate the original array", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", addedAt: "2023-06-01T00:00:00Z" }),
      makeTrack({ id: "b", uri: "spotify:track:b", addedAt: "2023-01-01T00:00:00Z" }),
    ];
    const original = [...tracks];
    sortTracks(tracks, { field: "likedDate", order: "asc" });
    expect(tracks).toEqual(original);
  });
});
