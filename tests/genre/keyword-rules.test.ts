import { describe, it, expect } from "vitest";
import { matchKeywordRules, TRACK_NAME_RULES, ALBUM_NAME_RULES } from "@/lib/genre/keyword-rules";
import { extractKeywords } from "@/lib/genre/normalize";

describe("matchKeywordRules — track name", () => {
  it("detects 'symphony' as Classical/Orchestral", () => {
    const tokens = extractKeywords("Symphony No. 9 in D Minor");
    const matches = matchKeywordRules(tokens, TRACK_NAME_RULES);
    const genres = matches.map((m) => m.genre);
    expect(genres).toContain("Classical/Orchestral");
  });

  it("detects 'blues' as Jazz/Blues", () => {
    const tokens = extractKeywords("Chicago Blues");
    const matches = matchKeywordRules(tokens, TRACK_NAME_RULES);
    const genres = matches.map((m) => m.genre);
    expect(genres).toContain("Jazz/Blues");
  });

  it("detects 'reggaeton' as Latin", () => {
    const tokens = extractKeywords("Reggaeton Lento");
    const matches = matchKeywordRules(tokens, TRACK_NAME_RULES);
    expect(matches.map((m) => m.genre)).toContain("Latin");
  });

  it("returns empty for no-match track", () => {
    const tokens = extractKeywords("Love Story");
    const matches = matchKeywordRules(tokens, TRACK_NAME_RULES);
    expect(matches).toHaveLength(0);
  });
});

describe("matchKeywordRules — album name", () => {
  it("detects 'soundtrack' in album name", () => {
    const tokens = extractKeywords("Original Motion Picture Soundtrack");
    const matches = matchKeywordRules(tokens, ALBUM_NAME_RULES);
    expect(matches.map((m) => m.genre)).toContain("Soundtrack/Score");
  });

  it("detects 'orchestra' in album name", () => {
    const tokens = extractKeywords("Vienna Philharmonic Orchestra");
    const matches = matchKeywordRules(tokens, ALBUM_NAME_RULES);
    expect(matches.map((m) => m.genre)).toContain("Classical/Orchestral");
  });

  it("detects 'lofi' in album name", () => {
    const tokens = extractKeywords("Best Lofi Study Beats");
    const matches = matchKeywordRules(tokens, ALBUM_NAME_RULES);
    expect(matches.map((m) => m.genre)).toContain("Ambient/Lo-fi");
  });
});
