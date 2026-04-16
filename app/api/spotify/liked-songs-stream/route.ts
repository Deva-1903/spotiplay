import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { streamLikedSongs } from "@/lib/spotify/fetchLikedSongs";

export const maxDuration = 300;
// Force dynamic — no caching for SSE
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events endpoint for liked songs fetch.
 *
 * Event types emitted:
 *   { type: "progress", fetched: number, total: number }
 *   { type: "complete", tracks: NormalizedTrack[], warnings: TrackWarning[], totalFetched: number, totalAvailable: number }
 *   { type: "error", message: string }
 */
export async function GET(): Promise<Response> {
  const result = await getValidSession();

  if (!result) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = result.tokens.accessToken;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      function send(data: object) {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(enc.encode(line));
      }

      try {
        await streamLikedSongs(accessToken, {
          onProgress(fetched, total) {
            send({ type: "progress", fetched, total });
          },
          onComplete(tracks, warnings, totalFetched, totalAvailable) {
            send({ type: "complete", tracks, warnings, totalFetched, totalAvailable });
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch liked songs";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
