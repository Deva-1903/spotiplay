import {
  NormalizedTrack,
  PlaylistGenerationOptions,
  GeneratedPlaylistGroup,
} from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription, resolveCollision } from "./naming";
import { overflowChunk } from "./overflow";

const UNKNOWN_GENRE = "Other";

/**
 * Group tracks by their primary artist's first genre.
 * Tracks with no genres fall into "Other".
 * Requires tracks to have been enriched via enrichTracksWithGenres().
 */
export function genreGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  const { namingPrefix, chunkSize } = options;

  const map = new Map<string, NormalizedTrack[]>();

  for (const track of tracks) {
    // Use first genre as the primary bucket; fallback to "Other"
    const genre = normalizeGenre(track.genres[0]) ?? UNKNOWN_GENRE;
    const existing = map.get(genre) ?? [];
    existing.push(track);
    map.set(genre, existing);
  }

  const groups: GeneratedPlaylistGroup[] = [];
  const usedTitles = new Set<string>();

  // Sort alphabetically; "Other" last
  const sortedGenres = Array.from(map.keys()).sort((a, b) => {
    if (a === UNKNOWN_GENRE) return 1;
    if (b === UNKNOWN_GENRE) return -1;
    return a.localeCompare(b);
  });

  for (const genre of sortedGenres) {
    const genreTracks = map.get(genre)!;
    const chunks = overflowChunk(genreTracks, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partNumber = chunks.length > 1 ? i + 1 : undefined;
      const rawTitle = buildPlaylistTitle(namingPrefix, genre, partNumber);
      const title = resolveCollision(rawTitle, usedTitles);
      usedTitles.add(title);

      groups.push({
        id: `genre-${slugify(genre)}${partNumber ? `-part${partNumber}` : ""}`,
        title,
        description: buildPlaylistDescription("genre", chunk.length, genre),
        tracks: chunk,
        trackCount: chunk.length,
        warnings: [],
      });
    }
  }

  return groups;
}

/**
 * Capitalize and clean a raw Spotify genre string.
 * e.g. "pop rock" → "Pop Rock"
 */
function normalizeGenre(genre: string | undefined): string | null {
  if (!genre) return null;
  return genre
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
