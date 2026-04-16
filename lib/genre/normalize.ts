/**
 * Normalize a raw Spotify genre string for lookup in the canonical map.
 * - Lowercase
 * - Trim leading/trailing whitespace
 * - Collapse internal whitespace runs to a single space
 * - Normalize "and" / "&" consistently to "&"
 * - Strip punctuation except hyphens (preserve "hip-hop", "lo-fi", etc.)
 */
export function normalizeGenreString(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/[^\w\s&\-/]/g, "")
    .trim();
}

/**
 * Extract meaningful keyword tokens from a track or album name.
 * Returns lowercase single words, stripping common stop words.
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "in", "on", "at", "to", "for", "with",
  "by", "ft", "feat", "featuring", "remix", "edit", "version", "mix",
  "vol", "pt", "part", "ep", "lp", "deluxe", "remastered", "live",
]);

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}
