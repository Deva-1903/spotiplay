import { NormalizedTrack } from "../spotify/types";

/**
 * If a group exceeds chunkSize, split it into chunks.
 * Returns a single-element array if no chunking needed.
 */
export function overflowChunk(tracks: NormalizedTrack[], chunkSize: number): NormalizedTrack[][] {
  if (tracks.length <= chunkSize) return [tracks];

  const chunks: NormalizedTrack[][] = [];
  for (let i = 0; i < tracks.length; i += chunkSize) {
    chunks.push(tracks.slice(i, i + chunkSize));
  }
  return chunks;
}
