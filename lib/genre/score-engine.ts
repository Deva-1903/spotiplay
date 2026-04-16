import type { CanonicalGenre } from "./taxonomy";
import { CANONICAL_GENRES, CONFIDENCE_THRESHOLD } from "./taxonomy";
import { normalizeGenreString, extractKeywords } from "./normalize";
import { lookupCanonical } from "./canonical-map";
import { TRACK_NAME_RULES, ALBUM_NAME_RULES, matchKeywordRules } from "./keyword-rules";

export interface GenreScore {
  genre: CanonicalGenre;
  score: number;
}

export interface ScoreEngineResult {
  candidateScores: GenreScore[];
  primaryGenre: CanonicalGenre;
  secondaryGenres: CanonicalGenre[];
  confidence: number;
  normalizedArtistGenres: string[];
  titleKeywords: string[];
  albumKeywords: string[];
  needsAI: boolean;
}

/**
 * Run the weighted score engine over raw Spotify genre strings and
 * track/album name keyword signals.
 *
 * Scoring strategy:
 *  - Each matched canonical-map entry contributes its weight to that genre's bucket
 *  - Keyword rules contribute a smaller weight (scaled down to reduce noise)
 *  - Scores are normalized to 0–1 relative to the top score
 *  - Confidence = top_score / (top_score + second_score) — reflects separation gap
 */
export function runScoreEngine(
  artistGenres: string[],
  trackName: string,
  albumName: string,
): ScoreEngineResult {
  const scores = new Map<CanonicalGenre, number>();

  const addScore = (genre: CanonicalGenre, delta: number) => {
    scores.set(genre, (scores.get(genre) ?? 0) + delta);
  };

  // Stage 1: canonical map lookup on artist genres
  const normalizedArtistGenres: string[] = [];
  for (const raw of artistGenres) {
    const normalized = normalizeGenreString(raw);
    normalizedArtistGenres.push(normalized);
    const entry = lookupCanonical(normalized);
    if (entry) {
      addScore(entry.genre, entry.weight);
    }
  }

  // Stage 2: keyword heuristics on track name
  const titleKeywords = extractKeywords(trackName);
  const titleMatches = matchKeywordRules(titleKeywords, TRACK_NAME_RULES);
  for (const rule of titleMatches) {
    addScore(rule.genre, rule.weight * 0.5); // keyword signals get half weight
  }

  // Stage 3: keyword heuristics on album name
  const albumKeywords = extractKeywords(albumName);
  const albumMatches = matchKeywordRules(albumKeywords, ALBUM_NAME_RULES);
  for (const rule of albumMatches) {
    addScore(rule.genre, rule.weight * 0.4); // album signals get 40% weight
  }

  // Build sorted candidate list
  const candidateScores: GenreScore[] = CANONICAL_GENRES.filter(
    (g) => g !== "Mixed/Uncertain" && g !== "Other",
  )
    .map((genre) => ({ genre, score: scores.get(genre) ?? 0 }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  // No signals at all → return Other with zero confidence
  if (candidateScores.length === 0) {
    return {
      candidateScores: [],
      primaryGenre: "Other",
      secondaryGenres: [],
      confidence: 0,
      normalizedArtistGenres,
      titleKeywords,
      albumKeywords,
      needsAI: false,
    };
  }

  const topScore = candidateScores[0].score;
  const secondScore = candidateScores[1]?.score ?? 0;

  // Confidence: how much the top score dominates the second
  // = top / (top + second). If top is the only one, confidence = 1.
  const rawConfidence = secondScore === 0 ? 1 : topScore / (topScore + secondScore);

  const primaryGenre = candidateScores[0].genre;
  const secondaryGenres = candidateScores
    .slice(1)
    .filter((c) => c.score >= topScore * 0.4)
    .map((c) => c.genre)
    .slice(0, 2);

  const needsAI = rawConfidence < CONFIDENCE_THRESHOLD && candidateScores.length > 0;

  return {
    candidateScores,
    primaryGenre,
    secondaryGenres,
    confidence: rawConfidence,
    normalizedArtistGenres,
    titleKeywords,
    albumKeywords,
    needsAI,
  };
}
