/**
 * Spotify API client with retry/backoff and rate limit handling.
 */

const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function spotifyFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
  attempt = 0,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${SPOTIFY_API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10);
    const waitMs = retryAfter * 1000;
    console.warn(`Spotify rate limited. Waiting ${retryAfter}s before retry.`);
    await sleep(waitMs);
    return spotifyFetch<T>(path, accessToken, options, attempt);
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!response.ok) {
    if (attempt < MAX_RETRIES && response.status >= 500) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(`Spotify API error ${response.status}. Retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms`);
      await sleep(backoff);
      return spotifyFetch<T>(path, accessToken, options, attempt + 1);
    }
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Spotify API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Add tracks to a playlist in safe batches of 100 (Spotify's limit).
 * Returns number of tracks successfully added and any errors.
 */
export async function addTracksToPlaylist(
  playlistId: string,
  uris: string[],
  accessToken: string,
): Promise<{ added: number; errors: string[] }> {
  const BATCH_SIZE = 100;
  let added = 0;
  const errors: string[] = [];

  for (let i = 0; i < uris.length; i += BATCH_SIZE) {
    const batch = uris.slice(i, i + BATCH_SIZE);
    try {
      await spotifyFetch(
        `/playlists/${playlistId}/tracks`,
        accessToken,
        {
          method: "POST",
          body: JSON.stringify({ uris: batch }),
        },
      );
      added += batch.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
    }
    // Small delay between batches to be a good API citizen
    if (i + BATCH_SIZE < uris.length) {
      await sleep(100);
    }
  }

  return { added, errors };
}
