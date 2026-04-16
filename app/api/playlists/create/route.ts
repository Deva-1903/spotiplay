import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";
import { createPlaylists } from "@/lib/spotify/createPlaylists";
import { GeneratedPlaylistGroup, PlaylistGenerationOptions, DEFAULT_OPTIONS } from "@/lib/spotify/types";
import { playlistOptionsSchema } from "@/lib/validation/schemas";

export const maxDuration = 300;

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

  const groups = bodyObj.groups as GeneratedPlaylistGroup[] | undefined;
  if (!Array.isArray(groups) || groups.length === 0) {
    return NextResponse.json({ error: "groups must be a non-empty array" }, { status: 400 });
  }

  const options: PlaylistGenerationOptions = { ...DEFAULT_OPTIONS, ...optionsParse.data };
  const userId = result.session.spotify!.user.id;
  const accessToken = result.tokens.accessToken;

  try {
    const summary = await createPlaylists(groups, options, userId, accessToken);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Playlist creation failed";
    console.error("Playlist creation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
