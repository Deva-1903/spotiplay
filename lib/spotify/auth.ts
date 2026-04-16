import { SpotifyTokens, SpotifyUser } from "./types";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-library-read",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-private",
  "user-read-email",
].join(" ");

export function buildAuthUrl(state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI must be set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: SPOTIFY_SCOPES,
    show_dialog: "false",
  });

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return tokensFromResponse(data);
}

export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return tokensFromResponse(data, refreshToken);
}

function tokensFromResponse(data: Record<string, unknown>, existingRefreshToken?: string): SpotifyTokens {
  const expiresIn = (data.expires_in as number) ?? 3600;
  return {
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token as string) ?? existingRefreshToken ?? "",
    expiresAt: Date.now() + expiresIn * 1000 - 60_000, // subtract 60s buffer
    tokenType: (data.token_type as string) ?? "Bearer",
    scope: (data.scope as string) ?? "",
  };
}

export function isTokenExpired(tokens: SpotifyTokens): boolean {
  return Date.now() >= tokens.expiresAt;
}

export async function fetchSpotifyUser(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    displayName: data.display_name ?? data.id,
    email: data.email ?? "",
    imageUrl: data.images?.[0]?.url ?? null,
    country: data.country ?? "",
    product: data.product ?? "free",
  };
}

export function generateState(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    // Node.js fallback — dynamic import not needed; crypto is a global in Node 19+
    // Use Math.random as a last resort (auth routes only run server-side with Node crypto available)
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
