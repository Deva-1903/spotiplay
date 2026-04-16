import { NormalizedTrack, PlaylistGenerationOptions, GeneratedPlaylistGroup } from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription } from "./naming";

/**
 * Split tracks into fixed-size chunks.
 */
export function chunkGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  const { chunkSize, namingPrefix } = options;
  const groups: GeneratedPlaylistGroup[] = [];

  for (let i = 0; i < tracks.length; i += chunkSize) {
    const chunk = tracks.slice(i, i + chunkSize);
    const partNumber = Math.floor(i / chunkSize) + 1;
    const title = buildPlaylistTitle(namingPrefix, `Part ${String(partNumber).padStart(2, "0")}`);
    const description = buildPlaylistDescription("size", chunk.length, `Part ${partNumber}`);

    groups.push({
      id: `chunk-${partNumber}`,
      title,
      description,
      tracks: chunk,
      trackCount: chunk.length,
      warnings: [],
    });
  }

  return groups;
}
