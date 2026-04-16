import { describe, it, expect } from "vitest";
import { chunkGroup } from "@/lib/grouping/chunk";
import { makeTracks, DEFAULT_TEST_OPTIONS } from "./fixtures";

describe("chunkGroup", () => {
  it("splits 100 tracks into 1 chunk of 100", () => {
    const tracks = makeTracks(100);
    const groups = chunkGroup(tracks, { ...DEFAULT_TEST_OPTIONS, chunkSize: 100 });
    expect(groups).toHaveLength(1);
    expect(groups[0].trackCount).toBe(100);
  });

  it("splits 101 tracks into 2 chunks when chunkSize=100", () => {
    const tracks = makeTracks(101);
    const groups = chunkGroup(tracks, { ...DEFAULT_TEST_OPTIONS, chunkSize: 100 });
    expect(groups).toHaveLength(2);
    expect(groups[0].trackCount).toBe(100);
    expect(groups[1].trackCount).toBe(1);
  });

  it("creates no groups for 0 tracks", () => {
    const groups = chunkGroup([], { ...DEFAULT_TEST_OPTIONS, chunkSize: 50 });
    expect(groups).toHaveLength(0);
  });

  it("numbers parts correctly starting at 01", () => {
    const tracks = makeTracks(50);
    const groups = chunkGroup(tracks, { ...DEFAULT_TEST_OPTIONS, chunkSize: 20 });
    expect(groups).toHaveLength(3);
    expect(groups[0].title).toContain("Part 01");
    expect(groups[1].title).toContain("Part 02");
    expect(groups[2].title).toContain("Part 03");
  });

  it("includes naming prefix in titles", () => {
    const tracks = makeTracks(10);
    const groups = chunkGroup(tracks, {
      ...DEFAULT_TEST_OPTIONS,
      chunkSize: 50,
      namingPrefix: "My Library",
    });
    expect(groups[0].title).toContain("My Library");
  });

  it("preserves track order", () => {
    const tracks = makeTracks(5);
    const groups = chunkGroup(tracks, { ...DEFAULT_TEST_OPTIONS, chunkSize: 10 });
    expect(groups[0].tracks).toEqual(tracks);
  });
});
