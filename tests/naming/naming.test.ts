import { describe, it, expect } from "vitest";
import { buildPlaylistTitle, getAlphaBucket, getDecadeLabel, resolveCollision } from "@/lib/grouping/naming";

describe("buildPlaylistTitle", () => {
  it("combines prefix and label with separator", () => {
    expect(buildPlaylistTitle("Liked Songs", "2020s")).toBe("Liked Songs — 2020s");
  });

  it("adds part number when provided", () => {
    expect(buildPlaylistTitle("Liked Songs", "Taylor Swift", 1)).toBe(
      "Liked Songs — Taylor Swift — Part 01",
    );
  });

  it("formats part number with leading zero", () => {
    expect(buildPlaylistTitle("My Music", "A", 5)).toBe("My Music — A — Part 05");
  });

  it("handles empty prefix gracefully", () => {
    expect(buildPlaylistTitle("", "2020s")).toBe("2020s");
  });

  it("caps extremely long titles at 100 chars", () => {
    const longPrefix = "A".repeat(60);
    const longLabel = "B".repeat(60);
    const title = buildPlaylistTitle(longPrefix, longLabel);
    expect(title.length).toBeLessThanOrEqual(100);
  });

  it("sanitizes double spaces", () => {
    const title = buildPlaylistTitle("Liked  Songs", "2020s");
    expect(title).not.toContain("  ");
  });
});

describe("getAlphaBucket", () => {
  it("returns uppercase letter for regular words", () => {
    expect(getAlphaBucket("apple")).toBe("A");
    expect(getAlphaBucket("Banana")).toBe("B");
    expect(getAlphaBucket("ZEBRA")).toBe("Z");
  });

  it("returns # for non-letter starters", () => {
    expect(getAlphaBucket("123 track")).toBe("#");
    expect(getAlphaBucket("!exclaim")).toBe("#");
    expect(getAlphaBucket(" ")).toBe("#");
  });

  it("strips common articles before bucketing", () => {
    expect(getAlphaBucket("The Beatles")).toBe("B");
    expect(getAlphaBucket("A Great Song")).toBe("G");
    expect(getAlphaBucket("An Apple")).toBe("A");
  });
});

describe("getDecadeLabel", () => {
  it("returns correct decade string", () => {
    expect(getDecadeLabel(1990)).toBe("1990s");
    expect(getDecadeLabel(1999)).toBe("1990s");
    expect(getDecadeLabel(2000)).toBe("2000s");
    expect(getDecadeLabel(2023)).toBe("2020s");
  });
});

describe("resolveCollision", () => {
  it("returns original title if no collision", () => {
    const used = new Set<string>();
    expect(resolveCollision("Liked Songs — 2020s", used)).toBe("Liked Songs — 2020s");
  });

  it("appends (2) on first collision", () => {
    const used = new Set(["Liked Songs — 2020s"]);
    expect(resolveCollision("Liked Songs — 2020s", used)).toBe("Liked Songs — 2020s (2)");
  });

  it("keeps incrementing on multiple collisions", () => {
    const used = new Set(["Liked Songs — A", "Liked Songs — A (2)", "Liked Songs — A (3)"]);
    expect(resolveCollision("Liked Songs — A", used)).toBe("Liked Songs — A (4)");
  });
});
