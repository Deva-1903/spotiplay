import { NormalizedTrack, PlaylistGenerationOptions, GeneratedPlaylistGroup } from "../spotify/types";
import { buildPlaylistTitle, buildPlaylistDescription, resolveCollision } from "./naming";
import { overflowChunk } from "./overflow";

export function releaseYearGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  return genericYearGroup(
    tracks,
    options,
    (t) => t.releaseYear?.toString() ?? "Unknown Year",
    "release year",
    "year",
  );
}

export function likedYearGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  return genericYearGroup(
    tracks,
    options,
    (t) => new Date(t.addedAt).getFullYear().toString(),
    "year liked",
    "liked-year",
  );
}

export function likedMonthGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  return genericYearGroup(
    tracks,
    options,
    (t) => {
      const d = new Date(t.addedAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    },
    "month added",
    "liked-month",
  );
}

function genericYearGroup(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
  getKey: (t: NormalizedTrack) => string,
  strategyLabel: string,
  idPrefix: string,
): GeneratedPlaylistGroup[] {
  const { namingPrefix, chunkSize } = options;

  const map = new Map<string, NormalizedTrack[]>();
  for (const track of tracks) {
    const key = getKey(track);
    const existing = map.get(key) ?? [];
    existing.push(track);
    map.set(key, existing);
  }

  const groups: GeneratedPlaylistGroup[] = [];
  const usedTitles = new Set<string>();

  // Sort keys chronologically
  const sortedKeys = Array.from(map.keys()).sort();

  for (const key of sortedKeys) {
    const keyTracks = map.get(key)!;

    const chunks = overflowChunk(keyTracks, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const partNumber = chunks.length > 1 ? i + 1 : undefined;
      const rawTitle = buildPlaylistTitle(namingPrefix, `Added ${key}`, partNumber);
      // For release year, use key directly without "Added" prefix
      const labelTitle =
        idPrefix === "year" || idPrefix === "decade"
          ? buildPlaylistTitle(namingPrefix, key, partNumber)
          : rawTitle;
      const title = resolveCollision(labelTitle, usedTitles);
      usedTitles.add(title);

      groups.push({
        id: `${idPrefix}-${key.replace(/\s+/g, "-")}${partNumber ? `-part${partNumber}` : ""}`,
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
