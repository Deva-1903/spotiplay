import { NextResponse } from "next/server";
import { buildAuthUrl, generateState } from "@/lib/spotify/auth";
import { getSession } from "@/lib/spotify/session";

export async function GET(): Promise<NextResponse> {
  try {
    const state = generateState();
    const authUrl = buildAuthUrl(state);

    // Store state in session to verify on callback
    const session = await getSession();
    session.oauthState = state;
    await session.save();

    return NextResponse.redirect(authUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start login";
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(message)}`);
  }
}
