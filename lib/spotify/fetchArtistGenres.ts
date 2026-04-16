import { spotifyFetch } from "./client";
import { NormalizedTrack } from "./types";

interface SpotifyArtistFull {
  id: string;
  genres: string[];
  name: string;
}

interface ArtistsBatchResponse {
  artists: (SpotifyArtistFull | null)[];
}

const BATCH_SIZE = 50; // Spotify max per /artists request

/**
 * Fetch genres for all unique primary artists in the track list.
 * Returns a map of artistId → genres[].
 *
 * Artists with no genres get an empty array.
 * Unresolvable IDs are silently skipped.
 */
export async function fetchArtistGenres(
  tracks: NormalizedTrack[],
  accessToken: string,
  onProgress?: (fetched: number, total: number) => void,
): Promise<Map<string, string[]>> {
  // Collect unique artist IDs (skip nulls)
  const artistIds = [
    ...new Set(tracks.map((t) => t.primaryArtistId).filter((id): id is string => id !== null)),
  ];

  const genreMap = new Map<string, string[]>();
  const total = artistIds.length;
  let fetched = 0;

  onProgress?.(0, total);

  for (let i = 0; i < artistIds.length; i += BATCH_SIZE) {
    const batch = artistIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(",");

    try {
      const res = await spotifyFetch<ArtistsBatchResponse>(`/artists?ids=${ids}`, accessToken);

      for (const artist of res.artists) {
        if (artist) {
          genreMap.set(artist.id, artist.genres ?? []);
        }
      }
    } catch (err) {
      // Partial failure — skip this batch but continue
      console.warn(`Artist genre batch failed (offset ${i}):`, err);
    }

    fetched += batch.length;
    onProgress?.(fetched, total);

    // Polite delay between batches
    if (i + BATCH_SIZE < artistIds.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return genreMap;
}

/**
 * Attach genres from the genre map onto each track.
 * Returns a new array — does not mutate originals.
 */
export function enrichTracksWithGenres(
  tracks: NormalizedTrack[],
  genreMap: Map<string, string[]>,
): NormalizedTrack[] {
  return tracks.map((t) => ({
    ...t,
    genres: t.primaryArtistId ? (genreMap.get(t.primaryArtistId) ?? []) : [],
  }));
}
