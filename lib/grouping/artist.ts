import { NormalizedTrack, PlaylistGenerationOptions, GeneratedPlaylistGroup, TrackWarning } from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription, resolveCollision } from "./naming";
import { overflowChunk } from "./overflow";

export function artistGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  const { namingPrefix, chunkSize } = options;

  // Group by primaryArtist
  const map = new Map<string, NormalizedTrack[]>();
  for (const track of tracks) {
    const key = track.primaryArtist || "Unknown Artist";
    const existing = map.get(key) ?? [];
    existing.push(track);
    map.set(key, existing);
  }

  const groups: GeneratedPlaylistGroup[] = [];
  const usedTitles = new Set<string>();

  // Sort artists alphabetically for deterministic output
  const sortedArtists = Array.from(map.keys()).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );

  for (const artist of sortedArtists) {
    const artistTracks = map.get(artist)!;
    const warnings: TrackWarning[] = [];

    // Overflow chunk if artist has too many tracks
    const chunks = overflowChunk(artistTracks, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partNumber = chunks.length > 1 ? i + 1 : undefined;
      const rawTitle = buildPlaylistTitle(namingPrefix, artist, partNumber);
      const title = resolveCollision(rawTitle, usedTitles);
      usedTitles.add(title);

      groups.push({
        id: `artist-${slugify(artist)}${partNumber ? `-part${partNumber}` : ""}`,
        title,
        description: buildPlaylistDescription("artist", chunk.length, artist),
        tracks: chunk,
        trackCount: chunk.length,
        warnings,
      });
    }
  }

  return groups;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
