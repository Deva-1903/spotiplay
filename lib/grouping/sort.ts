import { NormalizedTrack, SortOptions } from "../spotify/types";

/**
 * Sort tracks deterministically by the given field and order.
 * Stable sort — preserves original order for equal elements.
 */
export function sortTracks(tracks: NormalizedTrack[], sort: SortOptions): NormalizedTrack[] {
  const { field, order } = sort;

  return [...tracks].sort((a, b) => {
    const cmp = compareByField(a, b, field);
    return order === "asc" ? cmp : -cmp;
  });
}

function compareByField(a: NormalizedTrack, b: NormalizedTrack, field: SortOptions["field"]): number {
  switch (field) {
    case "likedDate":
      return compareStrings(a.addedAt, b.addedAt);
    case "releaseDate": {
      const ra = a.releaseDate ?? "";
      const rb = b.releaseDate ?? "";
      return compareStrings(ra, rb);
    }
    case "trackName":
      return compareStrings(a.name.toLowerCase(), b.name.toLowerCase());
    case "artistName":
      return compareStrings(a.primaryArtist.toLowerCase(), b.primaryArtist.toLowerCase());
    case "albumName":
      return compareStrings(a.albumName.toLowerCase(), b.albumName.toLowerCase());
    default:
      return 0;
  }
}

function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
