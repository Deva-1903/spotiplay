import Anthropic from "@anthropic-ai/sdk";
import type { CanonicalGenre } from "./taxonomy";
import { CANONICAL_GENRES } from "./taxonomy";
import type { GenreClassifierInput } from "./types";
import type { GenreScore } from "./score-engine";

const MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

interface AIClassifierResult {
  primaryGenre: CanonicalGenre;
  secondaryGenres: CanonicalGenre[];
  confidence: number;
  rationale: string;
}

const TAXONOMY_LIST = CANONICAL_GENRES.filter(
  (g) => g !== "Mixed/Uncertain",
).join(", ");

/**
 * Call Claude Haiku to classify a track's genre when the score engine
 * is ambiguous (confidence below threshold).
 *
 * Returns null if the API call fails or returns invalid JSON.
 */
export async function classifyWithAI(
  input: GenreClassifierInput,
  candidateScores: GenreScore[],
): Promise<AIClassifierResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const topCandidates = candidateScores
    .slice(0, 5)
    .map((c) => `${c.genre} (score: ${c.score.toFixed(2)})`)
    .join(", ");

  const artistGenreList = input.artistGenres.join(", ") || "none";

  const prompt = `You are a music genre classifier. Classify this track into exactly one primary genre from the allowed taxonomy.

ALLOWED GENRES (pick ONLY from this list):
${TAXONOMY_LIST}

TRACK INFORMATION:
- Track name: ${input.trackName}
- Album name: ${input.albumName}
- Raw Spotify artist genres: ${artistGenreList}
- Top scoring candidates from rules engine: ${topCandidates || "none"}

INSTRUCTIONS:
1. Choose the single best primary genre from the allowed list above
2. Optionally name up to 2 secondary genres (must also be from the allowed list)
3. Give a confidence score from 0.0 to 1.0
4. Write a brief 1-sentence rationale
5. If truly ambiguous across multiple genres, use "Mixed/Uncertain" as primary

Respond with ONLY valid JSON matching this exact schema:
{
  "primaryGenre": "<genre from allowed list>",
  "secondaryGenres": ["<optional genre>"],
  "confidence": 0.0,
  "rationale": "<one sentence>"
}`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    // Extract JSON even if model wraps it in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    return validateAIResponse(parsed);
  } catch {
    return null;
  }
}

function validateAIResponse(parsed: unknown): AIClassifierResult | null {
  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;

  const primaryGenre = obj.primaryGenre;
  if (typeof primaryGenre !== "string") return null;
  if (!(CANONICAL_GENRES as readonly string[]).includes(primaryGenre)) return null;

  const confidence = obj.confidence;
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) return null;

  const rationale = obj.rationale;
  if (typeof rationale !== "string") return null;

  const rawSecondary = obj.secondaryGenres;
  const secondaryGenres: CanonicalGenre[] = [];
  if (Array.isArray(rawSecondary)) {
    for (const s of rawSecondary) {
      if (typeof s === "string" && (CANONICAL_GENRES as readonly string[]).includes(s)) {
        secondaryGenres.push(s as CanonicalGenre);
      }
    }
  }

  return {
    primaryGenre: primaryGenre as CanonicalGenre,
    secondaryGenres,
    confidence,
    rationale,
  };
}
