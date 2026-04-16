import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { generatePreview } from "@/lib/grouping/engine";
import { playlistOptionsSchema } from "@/lib/validation/schemas";
import { NormalizedTrack, TrackWarning, DEFAULT_OPTIONS } from "@/lib/spotify/types";

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

  const bodyObj = body as Record<string, unknown>;
  const optionsParse = playlistOptionsSchema.safeParse(bodyObj.options ?? {});
  if (!optionsParse.success) {
    return NextResponse.json(
      { error: "Invalid options", details: optionsParse.error.flatten() },
      { status: 400 },
    );
  }

  const tracks = bodyObj.tracks as NormalizedTrack[] | undefined;
  const warnings = (bodyObj.warnings as TrackWarning[] | undefined) ?? [];

  if (!Array.isArray(tracks)) {
    return NextResponse.json({ error: "tracks must be an array" }, { status: 400 });
  }

  try {
    const options = { ...DEFAULT_OPTIONS, ...optionsParse.data };
    const preview = generatePreview(tracks, warnings, options);
    return NextResponse.json(preview);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
