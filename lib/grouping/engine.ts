import {
  NormalizedTrack,
  PlaylistGenerationOptions,
  PlaylistPreview,
  GeneratedPlaylistGroup,
  TrackWarning,
} from "../spotify/types";
import { deduplicateTracks } from "./dedupe";
import { sortTracks } from "./sort";
import { chunkGroup } from "./chunk";
import { artistGroup } from "./artist";
import { releaseYearGroup, likedYearGroup, likedMonthGroup } from "./year";
import { decadeGroup } from "./decade";
import { alphaTrackGroup, alphaArtistGroup } from "./alphabetical";
import { genreGroup } from "./genre";

/**
 * Main grouping engine entry point.
 * Pure function — no side effects, fully testable.
 */
export function generatePreview(
  allTracks: NormalizedTrack[],
  warnings: TrackWarning[],
  options: PlaylistGenerationOptions,
): PlaylistPreview {
  const generatedAt = new Date().toISOString();

  // Step 1: Deduplicate
  const deduped = options.deduplicateUris ? deduplicateTracks(allTracks) : allTracks;

  // Step 2: Sort
  const sorted = sortTracks(deduped, options.sort);

  // Step 3: Group
  const rawGroups = applyStrategy(sorted, options);

  // Step 4: Filter small groups + collect skipped
  const { kept, skipped } = filterSmallGroups(rawGroups, options);

  // Step 5: For each kept group, apply sort + dedupe inside group (already done globally, but groups may have subset)
  // Sort is already applied globally, so groups maintain order. No re-sort needed.

  const totalValidTracks = sorted.length;
  const totalSkipped = allTracks.length - deduped.length; // duplicates removed

  return {
    totalLikedSongs: allTracks.length,
    totalValidTracks,
    totalSkippedTracks: totalSkipped,
    totalPlaylists: kept.length,
    groups: kept,
    skippedGroups: skipped,
    warnings,
    generatedAt,
  };
}

function applyStrategy(
  tracks: NormalizedTrack[],
  options: PlaylistGenerationOptions,
): GeneratedPlaylistGroup[] {
  switch (options.strategy) {
    case "chunk":
      return chunkGroup(tracks, options);
    case "artist":
      return artistGroup(tracks, options);
    case "releaseYear":
      return releaseYearGroup(tracks, options);
    case "decade":
      return decadeGroup(tracks, options);
    case "likedYear":
      return likedYearGroup(tracks, options);
    case "likedMonth":
      return likedMonthGroup(tracks, options);
    case "alphaTrack":
      return alphaTrackGroup(tracks, options);
    case "alphaArtist":
      return alphaArtistGroup(tracks, options);
    case "genre":
      return genreGroup(tracks, options);
    default:
      throw new Error(`Unknown strategy: ${(options as { strategy: string }).strategy}`);
  }
}

function filterSmallGroups(
  groups: GeneratedPlaylistGroup[],
  options: PlaylistGenerationOptions,
): {
  kept: GeneratedPlaylistGroup[];
  skipped: Array<{ title: string; trackCount: number; reason: string }>;
} {
  if (!options.skipSmallGroups) {
    return { kept: groups, skipped: [] };
  }

  const kept: GeneratedPlaylistGroup[] = [];
  const skipped: Array<{ title: string; trackCount: number; reason: string }> = [];

  for (const group of groups) {
    if (group.trackCount < options.minimumTracks) {
      skipped.push({
        title: group.title,
        trackCount: group.trackCount,
        reason: `Fewer than ${options.minimumTracks} tracks`,
      });
    } else {
      kept.push(group);
    }
  }

  return { kept, skipped };
}
