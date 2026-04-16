// ============================================================
// Core Spotify / Session Types
// ============================================================

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp ms
  tokenType: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  imageUrl: string | null;
  country: string;
  product: string; // "premium" | "free" | etc.
}

export interface SpotifySession {
  tokens: SpotifyTokens;
  user: SpotifyUser;
}

// ============================================================
// Normalized Track Model
// ============================================================

export interface NormalizedTrack {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  primaryArtist: string;
  primaryArtistId: string | null;
  albumName: string;
  albumId: string;
  releaseDate: string | null; // ISO date string or null
  releaseYear: number | null;
  durationMs: number;
  explicit: boolean;
  popularity: number | null;
  addedAt: string; // ISO date string
  imageUrl: string | null;
  spotifyUrl: string;
  isPlayable: boolean;
  genres: string[]; // populated after enrichTracksWithGenres(); empty array if not fetched
}

// ============================================================
// Grouping Strategy
// ============================================================

export type GroupingStrategy =
  | "chunk"
  | "artist"
  | "releaseYear"
  | "decade"
  | "likedMonth"
  | "likedYear"
  | "alphaTrack"
  | "alphaArtist"
  | "genre";

export type SortField = "likedDate" | "releaseDate" | "trackName" | "artistName" | "albumName";
export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export interface PlaylistGenerationOptions {
  strategy: GroupingStrategy;
  chunkSize: number; // used when strategy = "chunk" or for overflow chunks
  minimumTracks: number; // skip groups smaller than this
  skipSmallGroups: boolean;
  visibility: "public" | "private";
  namingPrefix: string;
  sort: SortOptions;
  deduplicateUris: boolean;
}

export const DEFAULT_OPTIONS: PlaylistGenerationOptions = {
  strategy: "chunk",
  chunkSize: 100,
  minimumTracks: 3,
  skipSmallGroups: true,
  visibility: "private",
  namingPrefix: "Liked Songs",
  sort: { field: "likedDate", order: "desc" },
  deduplicateUris: true,
};

// ============================================================
// Generated Playlist Groups (Preview)
// ============================================================

export interface TrackWarning {
  trackId: string | null;
  message: string;
}

export interface GeneratedPlaylistGroup {
  id: string; // deterministic, e.g. "artist-taylor-swift"
  title: string;
  description: string;
  tracks: NormalizedTrack[];
  trackCount: number;
  warnings: TrackWarning[];
}

// ============================================================
// Preview Summary
// ============================================================

export interface PlaylistPreview {
  totalLikedSongs: number;
  totalValidTracks: number;
  totalSkippedTracks: number;
  totalPlaylists: number;
  groups: GeneratedPlaylistGroup[];
  skippedGroups: Array<{ title: string; trackCount: number; reason: string }>;
  warnings: TrackWarning[];
  generatedAt: string; // ISO timestamp
}

// ============================================================
// Playlist Creation Results
// ============================================================

export interface PlaylistCreateResult {
  groupId: string;
  title: string;
  spotifyPlaylistId: string | null;
  spotifyPlaylistUrl: string | null;
  tracksAdded: number;
  tracksFailed: number;
  error: string | null;
  success: boolean;
}

export interface PlaylistCreationSummary {
  totalPlaylists: number;
  succeeded: number;
  failed: number;
  results: PlaylistCreateResult[];
  createdAt: string;
}

// ============================================================
// Spotify API Raw Types (minimal, only what we use)
// ============================================================

export interface SpotifyRawTrack {
  id: string | null;
  uri: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    release_date: string | null;
    release_date_precision: string | null;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  is_playable?: boolean;
  restrictions?: { reason: string };
  external_urls: { spotify: string };
}

export interface SpotifyRawSavedTrack {
  added_at: string;
  track: SpotifyRawTrack | null;
}

export interface SpotifyPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}
