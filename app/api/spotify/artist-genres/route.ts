import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { fetchArtistGenres, enrichTracksWithGenres } from "@/lib/spotify/fetchArtistGenres";
import { NormalizedTrack } from "@/lib/spotify/types";
import { classifyTracks } from "@/lib/genre/classify-track";
import type { GenreClassifierInput } from "@/lib/genre/types";

export const maxDuration = 120;

/**
 * POST /api/spotify/artist-genres
 * Body: { tracks: NormalizedTrack[] }
 * Response: { tracks: NormalizedTrack[] } — tracks enriched with genres[] and genreClassification
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await getValidSession();
  if (!result) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tracks = (body as Record<string, unknown>).tracks as NormalizedTrack[] | undefined;
  if (!Array.isArray(tracks)) {
    return NextResponse.json({ error: "tracks must be an array" }, { status: 400 });
  }

  try {
    // Step 1: fetch Spotify artist genres and enrich tracks
    const genreMap = await fetchArtistGenres(tracks, result.tokens.accessToken);
    const enriched = enrichTracksWithGenres(tracks, genreMap);

    // Step 2: classify each track using the hybrid genre pipeline
    const inputs: GenreClassifierInput[] = enriched.map((track) => ({
      trackId: track.id,
      trackName: track.name,
      albumName: track.albumName,
      artistGenres: track.genres,
    }));

    const classifications = await classifyTracks(inputs);

    const classified: NormalizedTrack[] = enriched.map((track, i) => ({
      ...track,
      genreClassification: classifications[i],
    }));

    return NextResponse.json({ tracks: classified });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch genres";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
