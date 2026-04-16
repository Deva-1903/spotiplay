export const CANONICAL_GENRES = [
  "Pop",
  "Hip-Hop/Rap",
  "Rock",
  "Indie/Alternative",
  "R&B/Soul",
  "Electronic/Dance",
  "Metal",
  "Punk/Hardcore",
  "Jazz/Blues",
  "Classical/Orchestral",
  "Country/Americana",
  "Folk/Acoustic",
  "Latin",
  "K-Pop",
  "Ambient/Lo-fi",
  "Soundtrack/Score",
  "Reggae/Ska",
  "World/Regional",
  "Other",
  "Mixed/Uncertain",
] as const;

export type CanonicalGenre = (typeof CANONICAL_GENRES)[number];

export const CONFIDENCE_THRESHOLD = 0.55;
