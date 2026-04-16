import { NormalizedTrack, PlaylistGenerationOptions, DEFAULT_OPTIONS } from "@/lib/spotify/types";

export function makeTrack(overrides: Partial<NormalizedTrack> = {}): NormalizedTrack {
  return {
    id: "track-1",
    uri: "spotify:track:track-1",
    name: "Test Track",
    artists: ["Test Artist"],
    primaryArtist: "Test Artist",
    primaryArtistId: "artist-1",
    albumName: "Test Album",
    albumId: "album-1",
    releaseDate: "2020-01-01",
    releaseYear: 2020,
    durationMs: 180000,
    explicit: false,
    popularity: 60,
    addedAt: "2023-06-15T00:00:00Z",
    imageUrl: null,
    spotifyUrl: "https://open.spotify.com/track/track-1",
    isPlayable: true,
    genres: [],
    ...overrides,
  };
}

export function makeTracks(count: number, overrides: Partial<NormalizedTrack> = {}): NormalizedTrack[] {
  return Array.from({ length: count }, (_, i) =>
    makeTrack({
      id: `track-${i}`,
      uri: `spotify:track:track-${i}`,
      name: `Track ${i}`,
      ...overrides,
    }),
  );
}

export const DEFAULT_TEST_OPTIONS: PlaylistGenerationOptions = {
  ...DEFAULT_OPTIONS,
  skipSmallGroups: false,
  minimumTracks: 1,
};
