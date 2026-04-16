import { NormalizedTrack } from "../spotify/types";

/**
 * Remove duplicate URIs from a track list, keeping the first occurrence.
 * Stable — preserves ordering.
 */
export function deduplicateTracks(tracks: NormalizedTrack[]): NormalizedTrack[] {
  const seen = new Set<string>();
  const result: NormalizedTrack[] = [];
  for (const track of tracks) {
    if (!seen.has(track.uri)) {
      seen.add(track.uri);
      result.push(track);
    }
  }
  return result;
}
