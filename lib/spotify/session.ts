import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { SpotifySession, SpotifyTokens } from "./types";
import { refreshAccessToken, isTokenExpired } from "./auth";

export interface SessionData {
  spotify?: SpotifySession;
  oauthState?: string;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: "spotiplay_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

/**
 * Get the session and automatically refresh the access token if expired.
 * Returns null if the session is invalid or refresh failed.
 */
export async function getValidSession(): Promise<{ session: IronSession<SessionData>; tokens: SpotifyTokens } | null> {
  const session = await getSession();

  if (!session.spotify) {
    return null;
  }

  let tokens = session.spotify.tokens;

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens.refreshToken);
      session.spotify.tokens = tokens;
      await session.save();
    } catch (err) {
      console.error("Token refresh failed:", err);
      // Clear the broken session
      session.destroy();
      return null;
    }
  }

  return { session, tokens };
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
