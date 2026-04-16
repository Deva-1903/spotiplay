import { describe, it, expect } from "vitest";
import { alphaTrackGroup, alphaArtistGroup } from "@/lib/grouping/alphabetical";
import { makeTrack, DEFAULT_TEST_OPTIONS } from "./fixtures";

describe("alphaTrackGroup", () => {
  it("groups by first letter of track name", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "Apple Song" }),
      makeTrack({ id: "b", uri: "spotify:track:b", name: "Banana Blues" }),
      makeTrack({ id: "c", uri: "spotify:track:c", name: "Alpha Track" }),
    ];
    const groups = alphaTrackGroup(tracks, DEFAULT_TEST_OPTIONS);
    const aGroup = groups.find((g) => g.title.endsWith("A"));
    expect(aGroup?.trackCount).toBe(2);
    const bGroup = groups.find((g) => g.title.endsWith("B"));
    expect(bGroup?.trackCount).toBe(1);
  });

  it("puts non-letter starters in # bucket", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "123 Song" }),
      makeTrack({ id: "b", uri: "spotify:track:b", name: "!exclaim" }),
    ];
    const groups = alphaTrackGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toContain("#");
  });

  it("strips common articles before bucketing", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "The Beatles Song" }),
    ];
    const groups = alphaTrackGroup(tracks, DEFAULT_TEST_OPTIONS);
    // "The Beatles Song" → "Beatles Song" → B
    const bGroup = groups.find((g) => g.title.endsWith("B"));
    expect(bGroup).toBeDefined();
  });

  it("orders # bucket first, then alphabetical", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", name: "Zebra" }),
      makeTrack({ id: "b", uri: "spotify:track:b", name: "123 Track" }),
      makeTrack({ id: "c", uri: "spotify:track:c", name: "Apple" }),
    ];
    const groups = alphaTrackGroup(tracks, DEFAULT_TEST_OPTIONS);
    expect(groups[0].title).toContain("#");
  });
});

describe("alphaArtistGroup", () => {
  it("groups by first letter of primary artist name", () => {
    const tracks = [
      makeTrack({ id: "a", uri: "spotify:track:a", primaryArtist: "Taylor Swift" }),
      makeTrack({ id: "b", uri: "spotify:track:b", primaryArtist: "The Weeknd" }),
      makeTrack({ id: "c", uri: "spotify:track:c", primaryArtist: "Tame Impala" }),
    ];
    const groups = alphaArtistGroup(tracks, DEFAULT_TEST_OPTIONS);
    // "The Weeknd" → "Weeknd" → W; "Taylor Swift" → T; "Tame Impala" → T
    const tGroup = groups.find((g) => g.title.endsWith("T"));
    expect(tGroup?.trackCount).toBe(2);
    const wGroup = groups.find((g) => g.title.endsWith("W"));
    expect(wGroup?.trackCount).toBe(1);
  });
});
