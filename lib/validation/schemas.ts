import { z } from "zod";

export const groupingStrategySchema = z.enum([
  "chunk",
  "artist",
  "genre",
  "releaseYear",
  "decade",
  "likedMonth",
  "likedYear",
  "alphaTrack",
  "alphaArtist",
]);

export const sortFieldSchema = z.enum([
  "likedDate",
  "releaseDate",
  "trackName",
  "artistName",
  "albumName",
]);

export const sortOrderSchema = z.enum(["asc", "desc"]);

export const playlistOptionsSchema = z.object({
  strategy: groupingStrategySchema,
  chunkSize: z.number().int().min(10).max(500).default(100),
  minimumTracks: z.number().int().min(1).max(50).default(3),
  skipSmallGroups: z.boolean().default(true),
  visibility: z.enum(["public", "private"]).default("private"),
  namingPrefix: z.string().max(50).default("Liked Songs"),
  sort: z.object({
    field: sortFieldSchema,
    order: sortOrderSchema,
  }).default({ field: "likedDate", order: "desc" }),
  deduplicateUris: z.boolean().default(true),
});

export type PlaylistOptionsInput = z.input<typeof playlistOptionsSchema>;
export type PlaylistOptionsOutput = z.output<typeof playlistOptionsSchema>;
