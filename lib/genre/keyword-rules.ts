import type { CanonicalGenre } from "./taxonomy";

/**
 * Keyword signal rules for track name and album name analysis.
 * Each rule maps a keyword (matched as a whole word, case-insensitive) to
 * a canonical genre and a weight (how strong the signal is).
 */
export interface KeywordRule {
  keyword: string;
  genre: CanonicalGenre;
  weight: number;
}

export const TRACK_NAME_RULES: KeywordRule[] = [
  // Hip-Hop / Rap signals
  { keyword: "freestyle", genre: "Hip-Hop/Rap", weight: 0.5 },
  { keyword: "cypher", genre: "Hip-Hop/Rap", weight: 0.6 },
  { keyword: "diss", genre: "Hip-Hop/Rap", weight: 0.5 },
  { keyword: "bars", genre: "Hip-Hop/Rap", weight: 0.4 },

  // Electronic / Dance signals
  { keyword: "remix", genre: "Electronic/Dance", weight: 0.3 },
  { keyword: "mix", genre: "Electronic/Dance", weight: 0.2 },
  { keyword: "vip", genre: "Electronic/Dance", weight: 0.3 },
  { keyword: "bootleg", genre: "Electronic/Dance", weight: 0.3 },
  { keyword: "flip", genre: "Electronic/Dance", weight: 0.25 },

  // Soundtrack signals
  { keyword: "theme", genre: "Soundtrack/Score", weight: 0.35 },
  { keyword: "overture", genre: "Soundtrack/Score", weight: 0.6 },
  { keyword: "suite", genre: "Classical/Orchestral", weight: 0.5 },
  { keyword: "sonata", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "symphony", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "concerto", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "nocturne", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "etude", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "prelude", genre: "Classical/Orchestral", weight: 0.6 },
  { keyword: "fugue", genre: "Classical/Orchestral", weight: 0.8 },

  // Reggae / Ska signals
  { keyword: "riddim", genre: "Reggae/Ska", weight: 0.7 },
  { keyword: "dub", genre: "Reggae/Ska", weight: 0.4 },

  // Jazz / Blues signals
  { keyword: "blues", genre: "Jazz/Blues", weight: 0.7 },
  { keyword: "jazz", genre: "Jazz/Blues", weight: 0.8 },
  { keyword: "swing", genre: "Jazz/Blues", weight: 0.5 },
  { keyword: "bebop", genre: "Jazz/Blues", weight: 0.8 },

  // Latin signals
  { keyword: "salsa", genre: "Latin", weight: 0.7 },
  { keyword: "cumbia", genre: "Latin", weight: 0.8 },
  { keyword: "bachata", genre: "Latin", weight: 0.8 },
  { keyword: "merengue", genre: "Latin", weight: 0.8 },
  { keyword: "reggaeton", genre: "Latin", weight: 0.9 },
];

export const ALBUM_NAME_RULES: KeywordRule[] = [
  // Classical signals in album names
  { keyword: "symphony", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "concerto", genre: "Classical/Orchestral", weight: 0.7 },
  { keyword: "opera", genre: "Classical/Orchestral", weight: 0.8 },
  { keyword: "philharmonic", genre: "Classical/Orchestral", weight: 0.85 },
  { keyword: "orchestra", genre: "Classical/Orchestral", weight: 0.8 },
  { keyword: "quartet", genre: "Classical/Orchestral", weight: 0.7 },

  // Soundtrack signals in album names
  { keyword: "soundtrack", genre: "Soundtrack/Score", weight: 0.9 },
  { keyword: "score", genre: "Soundtrack/Score", weight: 0.6 },
  { keyword: "ost", genre: "Soundtrack/Score", weight: 0.85 },
  { keyword: "musical", genre: "Soundtrack/Score", weight: 0.7 },

  // Lo-fi / Ambient signals
  { keyword: "lofi", genre: "Ambient/Lo-fi", weight: 0.8 },
  { keyword: "lo-fi", genre: "Ambient/Lo-fi", weight: 0.8 },
  { keyword: "chill", genre: "Ambient/Lo-fi", weight: 0.5 },
  { keyword: "ambient", genre: "Ambient/Lo-fi", weight: 0.8 },
  { keyword: "study", genre: "Ambient/Lo-fi", weight: 0.6 },

  // Gospel
  { keyword: "gospel", genre: "R&B/Soul", weight: 0.7 },
  { keyword: "hymn", genre: "R&B/Soul", weight: 0.6 },
  { keyword: "worship", genre: "R&B/Soul", weight: 0.6 },
];

/**
 * Match keyword rules against a list of tokens extracted from a text.
 * Returns matched rules (potentially multiple per text).
 */
export function matchKeywordRules(tokens: string[], rules: KeywordRule[]): KeywordRule[] {
  const tokenSet = new Set(tokens);
  return rules.filter((rule) => tokenSet.has(rule.keyword));
}
