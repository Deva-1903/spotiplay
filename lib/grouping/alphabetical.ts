import { NormalizedTrack, PlaylistGenerationOptions, GeneratedPlaylistGroup } from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription, getAlphaBucket, resolveCollision } from "./naming";
import { overflowChunk } from "./overflow";

export function alphaTrackGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  return alphabeticalGroup(tracks, options, (t) => getAlphaBucket(t.name), "track name", "alpha-track");
}

export function alphaArtistGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  return alphabeticalGroup(tracks, options, (t) => getAlphaBucket(t.primaryArtist), "artist name", "alpha-artist");
}

function alphabeticalGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
  getBucket: (t: NormalizedTrack) => string,
  strategyLabel: string,
  idPrefix: string,
): GeneratedPlaylistGroup[] {
  const { namingPrefix, chunkSize } = options;

  const map = new Map<string, NormalizedTrack[]>();
  for (const track of tracks) {
    const bucket = getBucket(track);
    const existing = map.get(bucket) ?? [];
    existing.push(track);
    map.set(bucket, existing);
  }

  const groups: GeneratedPlaylistGroup[] = [];
  const usedTitles = new Set<string>();

  // "#" first, then A-Z
  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === "#") return -1;
    if (b === "#") return 1;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const bucketTracks = map.get(key)!;

    const chunks = overflowChunk(bucketTracks, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partNumber = chunks.length > 1 ? i + 1 : undefined;
      const rawTitle = buildPlaylistTitle(namingPrefix, key, partNumber);
      const title = resolveCollision(rawTitle, usedTitles);
      usedTitles.add(title);

      groups.push({
        id: `${idPrefix}-${key.toLowerCase()}${partNumber ? `-part${partNumber}` : ""}`,
        title,
        description: buildPlaylistDescription(strategyLabel, chunk.length, key),
        tracks: chunk,
        trackCount: chunk.length,
        warnings: [],
      });
    }
  }

  return groups;
}
