/**
 * Format milliseconds as M:SS
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format a number with commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format an ISO date string as a readable date
 */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Strategy display names for UI
 */
export const STRATEGY_LABELS: Record<string, string> = {
  chunk: "Fixed Size Chunks",
  artist: "By Primary Artist",
  genre: "By Genre",
  releaseYear: "By Release Year",
  decade: "By Decade",
  likedMonth: "By Month Liked",
  likedYear: "By Year Liked",
  alphaTrack: "Alphabetical (Track Name)",
  alphaArtist: "Alphabetical (Artist Name)",
};

export const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  chunk: "Split your library into equal-sized playlists",
  artist: "One playlist per artist (based on primary artist)",
  genre: "One playlist per genre — fetches artist genres from Spotify (takes a moment)",
  releaseYear: "One playlist per release year",
  decade: "One playlist per decade (1990s, 2000s, etc.)",
  likedMonth: "Grouped by the month you liked each song (YYYY-MM)",
  likedYear: "Grouped by the year you liked each song",
  alphaTrack: "Alphabetical buckets by track name (A, B, C…)",
  alphaArtist: "Alphabetical buckets by artist name (A, B, C…)",
};

/** Strategies that require an extra artist genre fetch before preview */
export const STRATEGY_NEEDS_GENRES: Set<string> = new Set(["genre"]);
