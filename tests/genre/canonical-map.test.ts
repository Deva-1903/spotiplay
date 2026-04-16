import { describe, it, expect } from "vitest";
import { lookupCanonical } from "@/lib/genre/canonical-map";
import { normalizeGenreString } from "@/lib/genre/normalize";

describe("lookupCanonical", () => {
  it("maps 'pop' → Pop", () => {
    expect(lookupCanonical("pop")?.genre).toBe("Pop");
  });

  it("maps 'hip hop' → Hip-Hop/Rap", () => {
    expect(lookupCanonical("hip hop")?.genre).toBe("Hip-Hop/Rap");
  });

  it("maps 'trap' → Hip-Hop/Rap", () => {
    expect(lookupCanonical("trap")?.genre).toBe("Hip-Hop/Rap");
  });

  it("maps 'k-pop' → K-Pop", () => {
    expect(lookupCanonical("k-pop")?.genre).toBe("K-Pop");
  });

  it("maps 'reggaeton' → Latin", () => {
    expect(lookupCanonical("reggaeton")?.genre).toBe("Latin");
  });

  it("maps 'heavy metal' → Metal", () => {
    expect(lookupCanonical("heavy metal")?.genre).toBe("Metal");
  });

  it("maps 'ambient' → Ambient/Lo-fi", () => {
    expect(lookupCanonical("ambient")?.genre).toBe("Ambient/Lo-fi");
  });

  it("returns undefined for unknown genre", () => {
    expect(lookupCanonical("totally-unknown-micro-genre-xyz")).toBeUndefined();
  });

  it("works after normalize pipeline", () => {
    // Spotify returns 'Dance Pop' → should normalize and resolve
    const normalized = normalizeGenreString("Dance Pop");
    expect(lookupCanonical(normalized)?.genre).toBe("Pop");
  });

  it("maps 'uk drill' → Hip-Hop/Rap after normalization", () => {
    const normalized = normalizeGenreString("UK Drill");
    expect(lookupCanonical(normalized)?.genre).toBe("Hip-Hop/Rap");
  });

  it("high-confidence entries have weight >= 0.9", () => {
    expect(lookupCanonical("k-pop")?.weight).toBeGreaterThanOrEqual(0.9);
    expect(lookupCanonical("reggaeton")?.weight).toBeGreaterThanOrEqual(0.9);
  });
});
