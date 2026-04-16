import type { GenreClassification, GenreClassifierInput } from "./types";
import { CONFIDENCE_THRESHOLD } from "./taxonomy";
import { runScoreEngine } from "./score-engine";
import { classifyWithAI } from "./ai-classifier";
import { buildCacheKey, getCached, setCached } from "./cache";
import { lookupCanonical } from "./canonical-map";

/**
 * Main entry point for genre classification.
 *
 * Pipeline stages:
 * 1. Cache check — return immediately if already classified
 * 2. Score engine — deterministic canonical-map + keyword heuristics
 * 3. If confidence ≥ threshold → "rules" or "heuristics" result
 * 4. If confidence < threshold → AI fallback (Claude Haiku)
 * 5. If AI unavailable/fails → Mixed/Uncertain fallback
 */
export async function classifyTrack(input: GenreClassifierInput): Promise<GenreClassification> {
  const cacheKey = buildCacheKey(input.trackId, input.artistGenres);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const engineResult = runScoreEngine(input.artistGenres, input.trackName, input.albumName);

  // Determine if the result came purely from canonical map or also from keyword heuristics
  const hasCanonicalSignal = engineResult.normalizedArtistGenres.some(
    (g) => lookupCanonical(g) !== undefined,
  );

  let classification: GenreClassification;

  if (!engineResult.needsAI) {
    // No signals at all → genuine fallback
    if (engineResult.confidence === 0) {
      const classification: GenreClassification = {
        primaryGenre: "Other",
        secondaryGenres: [],
        confidence: 0,
        source: "fallback",
        rationale: "No genre signals found; marked as uncertain.",
        signals: {
          normalizedArtistGenres: engineResult.normalizedArtistGenres,
          titleKeywords: engineResult.titleKeywords,
          albumKeywords: engineResult.albumKeywords,
          candidateScores: [],
          aiUsed: false,
        },
      };
      setCached(cacheKey, classification);
      return classification;
    }

    // Confident enough from rules alone
    const source = hasCanonicalSignal ? "rules" : "heuristics";
    classification = {
      primaryGenre: engineResult.primaryGenre,
      secondaryGenres: engineResult.secondaryGenres,
      confidence: engineResult.confidence,
      source,
      rationale: buildRulesRationale(engineResult.primaryGenre, engineResult.normalizedArtistGenres),
      signals: {
        normalizedArtistGenres: engineResult.normalizedArtistGenres,
        titleKeywords: engineResult.titleKeywords,
        albumKeywords: engineResult.albumKeywords,
        candidateScores: engineResult.candidateScores,
        aiUsed: false,
      },
    };
  } else {
    // Score engine is ambiguous → try AI
    const aiResult = await classifyWithAI(input, engineResult.candidateScores);

    if (aiResult && aiResult.confidence >= CONFIDENCE_THRESHOLD) {
      classification = {
        primaryGenre: aiResult.primaryGenre,
        secondaryGenres: aiResult.secondaryGenres,
        confidence: aiResult.confidence,
        source: "ai",
        rationale: aiResult.rationale,
        signals: {
          normalizedArtistGenres: engineResult.normalizedArtistGenres,
          titleKeywords: engineResult.titleKeywords,
          albumKeywords: engineResult.albumKeywords,
          candidateScores: engineResult.candidateScores,
          aiUsed: true,
        },
      };
    } else {
      // Fallback: use engine's best guess or Mixed/Uncertain
      const fallbackGenre =
        engineResult.candidateScores.length > 0
          ? engineResult.primaryGenre
          : "Mixed/Uncertain";

      classification = {
        primaryGenre: fallbackGenre,
        secondaryGenres: engineResult.secondaryGenres,
        confidence: engineResult.confidence,
        source: "fallback",
        rationale:
          engineResult.candidateScores.length > 0
            ? `Low-confidence guess: ${fallbackGenre} based on partial signals.`
            : "No genre signals found; marked as uncertain.",
        signals: {
          normalizedArtistGenres: engineResult.normalizedArtistGenres,
          titleKeywords: engineResult.titleKeywords,
          albumKeywords: engineResult.albumKeywords,
          candidateScores: engineResult.candidateScores,
          aiUsed: aiResult !== null,
        },
      };
    }
  }

  setCached(cacheKey, classification);
  return classification;
}

/**
 * Classify a batch of tracks, re-using cached results.
 */
export async function classifyTracks(inputs: GenreClassifierInput[]): Promise<GenreClassification[]> {
  return Promise.all(inputs.map(classifyTrack));
}

function buildRulesRationale(primaryGenre: string, normalizedGenres: string[]): string {
  if (normalizedGenres.length === 0) return `Classified as ${primaryGenre} via keyword signals.`;
  const sample = normalizedGenres.slice(0, 3).join(", ");
  return `Artist tags (${sample}) map to ${primaryGenre}.`;
}
