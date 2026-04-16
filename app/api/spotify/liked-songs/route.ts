import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { fetchAllLikedSongs } from "@/lib/spotify/fetchLikedSongs";

export const maxDuration = 300; // Allow up to 5 minutes for large libraries

export async function GET(): Promise<NextResponse> {
  const result = await getValidSession();

  if (!result) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { tracks, warnings, totalFetched, totalAvailable } = await fetchAllLikedSongs(
      result.tokens.accessToken,
    );

    return NextResponse.json({
      tracks,
      warnings,
      totalFetched,
      totalAvailable,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch liked songs";
    console.error("Liked songs fetch error:", err);

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
