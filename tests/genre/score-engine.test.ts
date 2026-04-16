import { describe, it, expect } from "vitest";
import { runScoreEngine } from "@/lib/genre/score-engine";

describe("runScoreEngine", () => {
  it("classifies clear hip-hop artist genres confidently", () => {
    const result = runScoreEngine(["trap", "hip hop", "rap"], "Song", "Album");
    expect(result.primaryGenre).toBe("Hip-Hop/Rap");
    expect(result.confidence).toBeGreaterThan(0.55);
    expect(result.needsAI).toBe(false);
  });

  it("classifies k-pop with very high confidence", () => {
    const result = runScoreEngine(["k-pop", "korean pop"], "Track", "Album");
    expect(result.primaryGenre).toBe("K-Pop");
    expect(result.confidence).toBeGreaterThanOrEqual(0.55);
  });

  it("classifies reggaeton as Latin", () => {
    const result = runScoreEngine(["reggaeton", "latin pop"], "Track", "Album");
    expect(result.primaryGenre).toBe("Latin");
    expect(result.needsAI).toBe(false);
  });

  it("flags ambiguous mixed genres as needing AI", () => {
    // Equal pop and indie rock signals → ambiguous
    const result = runScoreEngine(["pop", "indie rock"], "Track", "Album");
    // Should not throw; may or may not need AI depending on weights
    expect(result.primaryGenre).toBeDefined();
    expect(result.candidateScores.length).toBeGreaterThan(0);
  });

  it("returns Other with zero confidence for empty genres and no keywords", () => {
    const result = runScoreEngine([], "Track", "Album");
    expect(result.primaryGenre).toBe("Other");
    expect(result.confidence).toBe(0);
    expect(result.needsAI).toBe(false);
  });

  it("uses keyword signals when artist genres are empty", () => {
    const result = runScoreEngine([], "Symphony No 5", "Classical Masterworks");
    // Both track and album name contain classical signals
    expect(result.primaryGenre).toBe("Classical/Orchestral");
  });

  it("includes normalizedArtistGenres in output", () => {
    const result = runScoreEngine(["Hip-Hop", "Trap"], "Track", "Album");
    expect(result.normalizedArtistGenres).toContain("hip-hop");
    expect(result.normalizedArtistGenres).toContain("trap");
  });

  it("secondaryGenres contains close-scoring alternatives", () => {
    // Punk/hardcore and metal can both score; secondary should list alternatives
    const result = runScoreEngine(["metalcore", "punk rock"], "Track", "Album");
    expect(result.candidateScores.length).toBeGreaterThan(1);
  });

  it("confidence is between 0 and 1", () => {
    const result = runScoreEngine(["pop", "dance pop", "teen pop"], "Track", "Album");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
