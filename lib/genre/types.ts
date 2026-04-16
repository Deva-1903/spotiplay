import type { CanonicalGenre } from "./taxonomy";

export type { CanonicalGenre };

export interface GenreClassification {
  primaryGenre: CanonicalGenre;
  secondaryGenres: CanonicalGenre[];
  confidence: number; // 0–1
  source: "rules" | "heuristics" | "ai" | "fallback";
  rationale: string;
  signals: {
    normalizedArtistGenres: string[];
    titleKeywords: string[];
    albumKeywords: string[];
    candidateScores: Array<{ genre: CanonicalGenre; score: number }>;
    aiUsed?: boolean;
  };
}

export interface GenreClassifierInput {
  trackId: string;
  trackName: string;
  albumName: string;
  artistGenres: string[]; // raw Spotify genre strings
}
