import { describe, it, expect } from "vitest";
import { decadeGroup } from "@/lib/grouping/decade";
import { makeTrack, DEFAULT_TEST_OPTIONS } from "./fixtures";

describe("decadeGroup", () => {
  it("groups tracks by decade", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: 1995 }),
      makeTrack({ id: "b", uri: "spotify:track:b", releaseYear: 1998 }),
      makeTrack({ id: "c", uri: "spotify:track:c", releaseYear: 2005 }),
      makeTrack({ id: "d", uri: "spotify:track:d", releaseYear: 2010 }),
    ];

    const groups = decadeGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups).toHaveLength(3);

    const labels = groups.map((g) => g.title);
    expect(labels.some((l) => l.includes("1990s"))).toBe(true);
    expect(labels.some((l) => l.includes("2000s"))).toBe(true);
    expect(labels.some((l) => l.includes("2010s"))).toBe(true);
  });

  it("groups tracks with unknown release year as 'Unknown Era'", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: null }),
    ];
    const groups = decadeGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups[0].title).toContain("Unknown Era");
  });

  it("places Unknown Era at the end", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: 1990 }),
      makeTrack({ id: "b", uri: "spotify:track:b", releaseYear: null }),
    ];
    const groups = decadeGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups[groups.length - 1].title).toContain("Unknown Era");
  });

  it("sorts decades chronologically", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: 2020 }),
      makeTrack({ id: "b", uri: "spotify:track:b", releaseYear: 1980 }),
      makeTrack({ id: "c", uri: "spotify:track:c", releaseYear: 2000 }),
    ];
    const groups = decadeGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups[0].title).toContain("1980s");
    expect(groups[1].title).toContain("2000s");
    expect(groups[2].title).toContain("2020s");
  });

  it("returns all groups including small ones (filtering is engine responsibility)", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", releaseYear: 1990 }),
      makeTrack({ id: "b", uri: "spotify:track:b", releaseYear: 2000 }),
      makeTrack({ id: "c", uri: "spotify:track:c", releaseYear: 2000 }),
      makeTrack({ id: "d", uri: "spotify:track:d", releaseYear: 2000 }),
    ];
    const groups = decadeGroup(tracks, {
      ...DEFAULT_TEST_OPTIONS,
      skipSmallGroups: true,
      minimumTracks: 2,
    });
    // decadeGroup itself does not filter — the engine does
    expect(groups).toHaveLength(2);
    const labels = groups.map((g) => g.title);
    expect(labels.some((l) => l.includes("1990s"))).toBe(true);
    expect(labels.some((l) => l.includes("2000s"))).toBe(true);
  });
});
