import { spotifyFetch } from "./client";
import {
  NormalizedTrack,
  SpotifyRawSavedTrack,
  SpotifyPagingObject,
  TrackWarning,
} from "./types";

const PAGE_SIZE = 50; // Spotify max per request

export interface FetchLikedSongsResult {
  tracks: NormalizedTrack[];
  warnings: TrackWarning[];
  totalFetched: number;
  totalAvailable: number;
}

export type ProgressCallback = (fetched: number, total: number) => void;

export interface StreamCallbacks {
  onProgress: (fetched: number, total: number) => void;
  onComplete: (
    tracks: NormalizedTrack[],
    warnings: TrackWarning[],
    totalFetched: number,
    totalAvailable: number,
  ) => void;
}

/**
 * Streaming variant — calls onProgress per page, onComplete when done.
 * Designed for use in SSE routes.
 */
export async function streamLikedSongs(
  accessToken: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const result = await fetchAllLikedSongs(accessToken, callbacks.onProgress);
  callbacks.onComplete(result.tracks, result.warnings, result.totalFetched, result.totalAvailable);
}

export async function fetchAllLikedSongs(
  accessToken: string,
  onProgress?: ProgressCallback,
): Promise<FetchLikedSongsResult> {
  const tracks: NormalizedTrack[] = [];
  const warnings: TrackWarning[] = [];
  let totalAvailable = 0;

  // First page
  const firstPage = await spotifyFetch<SpotifyPagingObject<SpotifyRawSavedTrack>>(
    `/me/tracks?limit=${PAGE_SIZE}&offset=0&market=from_token`,
    accessToken,
  );

  totalAvailable = firstPage.total;
  onProgress?.(0, totalAvailable);

  processPage(firstPage.items, tracks, warnings);
  onProgress?.(tracks.length, totalAvailable);

  // Remaining pages
  let nextUrl: string | null = firstPage.next;
  while (nextUrl) {
    const page = await spotifyFetch<SpotifyPagingObject<SpotifyRawSavedTrack>>(
      nextUrl,
      accessToken,
    );

    processPage(page.items, tracks, warnings);
    onProgress?.(tracks.length, totalAvailable);

    nextUrl = page.next;

    // Small delay to be friendly to Spotify's API
    await new Promise((r) => setTimeout(r, 50));
  }

  return {
    tracks,
    warnings,
    totalFetched: tracks.length,
    totalAvailable,
  };
}

function processPage(
  items: SpotifyRawSavedTrack[],
  tracks: NormalizedTrack[],
  warnings: TrackWarning[],
): void {
  for (const item of items) {
    if (!item.track) {
      warnings.push({ trackId: null, message: "Encountered null track in liked songs — skipped" });
      continue;
    }

    const raw = item.track;

    if (!raw.id || raw.uri?.startsWith("spotify:local:")) {
      warnings.push({
        trackId: raw.id,
        message: `Local or unplayable track "${raw.name}" — skipped`,
      });
      continue;
    }

    const normalized = normalizeTrack(raw, item.added_at);
    tracks.push(normalized);
  }
}

function normalizeTrack(
  raw: NonNullable<SpotifyRawSavedTrack["track"]>,
  addedAt: string,
): NormalizedTrack {
  const releaseDate = raw.album?.release_date ?? null;
  const releaseYear = parseReleaseYear(releaseDate);

  const primaryArtist = raw.artists[0]?.name ?? "Unknown Artist";
  const artists = raw.artists.map((a) => a.name).filter(Boolean);

  const images = raw.album?.images ?? [];
  // Prefer middle-size image (usually index 1), fallback to first
  const imageUrl = images[1]?.url ?? images[0]?.url ?? null;

  const isPlayable = raw.is_playable !== false && !raw.restrictions?.reason;

  return {
    id: raw.id!,
    uri: raw.uri,
    name: raw.name,
    artists,
    primaryArtist,
    primaryArtistId: raw.artists[0]?.id ?? null,
    albumName: raw.album?.name ?? "Unknown Album",
    albumId: raw.album?.id ?? "",
    releaseDate,
    releaseYear,
    durationMs: raw.duration_ms,
    explicit: raw.explicit,
    popularity: raw.popularity ?? null,
    addedAt,
    imageUrl,
    spotifyUrl: raw.external_urls?.spotify ?? "",
    isPlayable,
    genres: [], // populated later by enrichTracksWithGenres if genre strategy is used
  };
}

function parseReleaseYear(releaseDate: string | null): number | null {
  if (!releaseDate) return null;

  const yearMatch = releaseDate.match(/^(\d{4})/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1], 10);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) return null;

  return year;
}
