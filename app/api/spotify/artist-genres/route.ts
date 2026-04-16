import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { fetchArtistGenres, enrichTracksWithGenres } from "@/lib/spotify/fetchArtistGenres";
import { NormalizedTrack } from "@/lib/spotify/types";

export const maxDuration = 120;

/**
 * POST /api/spotify/artist-genres
 * Body: { tracks: NormalizedTrack[] }
 * Response: { tracks: NormalizedTrack[] } — tracks enriched with genres[]
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
    const genreMap = await fetchArtistGenres(tracks, result.tokens.accessToken);
    const enriched = enrichTracksWithGenres(tracks, genreMap);
    return NextResponse.json({ tracks: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch genres";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
