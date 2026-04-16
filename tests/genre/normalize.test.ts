import { describe, it, expect } from "vitest";
import { normalizeGenreString, extractKeywords } from "@/lib/genre/normalize";

describe("normalizeGenreString", () => {
  it("lowercases input", () => {
    expect(normalizeGenreString("Pop Rock")).toBe("pop rock");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeGenreString("  jazz  ")).toBe("jazz");
  });

  it("collapses multiple spaces to one", () => {
    expect(normalizeGenreString("hip  hop")).toBe("hip hop");
  });

  it("normalizes 'and' to '&'", () => {
    expect(normalizeGenreString("drum and bass")).toBe("drum & bass");
  });

  it("preserves hyphens", () => {
    expect(normalizeGenreString("Lo-Fi Hip-Hop")).toBe("lo-fi hip-hop");
  });

  it("strips other punctuation", () => {
    expect(normalizeGenreString("r&b/soul")).toBe("r&b/soul");
  });

  it("handles empty string", () => {
    expect(normalizeGenreString("")).toBe("");
  });
});

describe("extractKeywords", () => {
  it("lowercases and splits on spaces", () => {
    expect(extractKeywords("Jazz Fusion")).toEqual(["jazz", "fusion"]);
  });

  it("removes stop words", () => {
    const result = extractKeywords("Songs of the Sea");
    expect(result).not.toContain("of");
    expect(result).not.toContain("the");
    expect(result).toContain("songs");
    expect(result).toContain("sea");
  });

  it("strips punctuation", () => {
    const result = extractKeywords("Rock 'n' Roll");
    expect(result).toContain("rock");
    expect(result).toContain("roll");
  });

  it("filters single-character tokens", () => {
    const result = extractKeywords("A Kind of Blue");
    expect(result).not.toContain("a");
  });

  it("returns empty array for empty string", () => {
    expect(extractKeywords("")).toEqual([]);
  });
});
