import { NormalizedTrack, PlaylistGenerationOptions, GeneratedPlaylistGroup } from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription, getDecadeLabel, resolveCollision } from "./naming";
import { overflowChunk } from "./overflow";

export function decadeGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  const { namingPrefix, chunkSize } = options;

  const map = new Map<string, NormalizedTrack[]>();
  for (const track of tracks) {
    const label = track.releaseYear ? getDecadeLabel(track.releaseYear) : "Unknown Era";
    const existing = map.get(label) ?? [];
    existing.push(track);
    map.set(label, existing);
  }

  const groups: GeneratedPlaylistGroup[] = [];
  const usedTitles = new Set<string>();

  // Sort keys: Unknown Era at end, then chronologically
  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === "Unknown Era") return 1;
    if (b === "Unknown Era") return -1;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const decadeTracks = map.get(key)!;

    const chunks = overflowChunk(decadeTracks, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partNumber = chunks.length > 1 ? i + 1 : undefined;
      const rawTitle = buildPlaylistTitle(namingPrefix, key, partNumber);
      const title = resolveCollision(rawTitle, usedTitles);
      usedTitles.add(title);

      groups.push({
        id: `decade-${key.replace(/\s+/g, "-")}${partNumber ? `-part${partNumber}` : ""}`,
        title,
        description: buildPlaylistDescription("decade", chunk.length, key),
        tracks: chunk,
        trackCount: chunk.length,
        warnings: [],
      });
    }
  }

  return groups;
}
