import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchSpotifyUser } from "@/lib/spotify/auth";
import { getSession } from "@/lib/spotify/session";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/?error=${encodeURIComponent(`Spotify declined: ${error}`)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/?error=${encodeURIComponent("Missing code or state from Spotify")}`,
    );
  }

  try {
    const session = await getSession();

    // Verify state to prevent CSRF
    if (!session.oauthState || session.oauthState !== state) {
      return NextResponse.redirect(
        `${APP_URL}/?error=${encodeURIComponent("Invalid OAuth state — please try again")}`,
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    const user = await fetchSpotifyUser(tokens.accessToken);

    session.spotify = { tokens, user };
    session.oauthState = undefined;
    await session.save();

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}/?error=${encodeURIComponent(message)}`,
    );
  }
}
