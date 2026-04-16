import { spotifyFetch, addTracksToPlaylist } from "./client";
import {
  GeneratedPlaylistGroup,
  PlaylistCreateResult,
  PlaylistCreationSummary,
  PlaylistGenerationOptions,
} from "./types";

export type CreationProgressCallback = (completed: number, total: number, current: string) => void;

export async function createPlaylists(
  groups: GeneratedPlaylistGroup[],
  options: PlaylistGenerationOptions,
  userId: string,
  accessToken: string,
  onProgress?: CreationProgressCallback,
): Promise<PlaylistCreationSummary> {
  const results: PlaylistCreateResult[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    onProgress?.(i, groups.length, group.title);

    const result = await createSinglePlaylist(group, options, userId, accessToken);
    results.push(result);
  }

  onProgress?.(groups.length, groups.length, "Done");

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    totalPlaylists: results.length,
    succeeded,
    failed,
    results,
    createdAt: new Date().toISOString(),
  };
}

async function createSinglePlaylist(
  group: GeneratedPlaylistGroup,
  options: PlaylistGenerationOptions,
  userId: string,
  accessToken: string,
): Promise<PlaylistCreateResult> {
  let spotifyPlaylistId: string | null = null;
  let spotifyPlaylistUrl: string | null = null;

  try {
    // Create the playlist
    const playlist = await spotifyFetch<{ id: string; external_urls: { spotify: string } }>(
      `/users/${userId}/playlists`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          name: group.title,
          description: group.description,
          public: options.visibility === "public",
          collaborative: false,
        }),
      },
    );

    spotifyPlaylistId = playlist.id;
    spotifyPlaylistUrl = playlist.external_urls?.spotify ?? null;

    // Add tracks
    const uris = group.tracks.map((t) => t.uri);
    const { added, errors } = await addTracksToPlaylist(spotifyPlaylistId, uris, accessToken);

    if (errors.length > 0) {
      console.warn(`Playlist "${group.title}" had track add errors:`, errors);
    }

    return {
      groupId: group.id,
      title: group.title,
      spotifyPlaylistId,
      spotifyPlaylistUrl,
      tracksAdded: added,
      tracksFailed: uris.length - added,
      error: errors.length > 0 ? errors.join("; ") : null,
      success: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to create playlist "${group.title}":`, message);

    return {
      groupId: group.id,
      title: group.title,
      spotifyPlaylistId,
      spotifyPlaylistUrl,
      tracksAdded: 0,
      tracksFailed: group.trackCount,
      error: message,
      success: false,
    };
  }
}
