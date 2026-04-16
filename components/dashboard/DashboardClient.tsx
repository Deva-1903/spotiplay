"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  NormalizedTrack,
  TrackWarning,
  PlaylistPreview,
  PlaylistGenerationOptions,
  DEFAULT_OPTIONS,
  GroupingStrategy,
  SortField,
  SortOrder,
} from "@/lib/spotify/types";
import { SpotifyUser } from "@/lib/spotify/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
  STRATEGY_NEEDS_GENRES,
  formatNumber,
} from "@/lib/utils/format";
import { loadPresets, savePreset, deletePreset, defaultPresetName, Preset } from "@/lib/utils/presets";
import {
  Music2,
  Download,
  AlertCircle,
  Loader2,
  LogOut,
  Settings,
  Eye,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  BookmarkCheck,
  Trash2,
  Tag,
} from "lucide-react";
import { PreviewPanel } from "@/components/preview/PreviewPanel";

interface Props {
  user: SpotifyUser;
}

type Phase =
  | "idle"
  | "fetching"
  | "fetched"
  | "enriching"  // fetching artist genres
  | "previewing"
  | "previewed"
  | "creating"
  | "done";

export function DashboardClient({ user }: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [fetchProgress, setFetchProgress] = useState({ fetched: 0, total: 0 });
  const [enrichProgress, setEnrichProgress] = useState({ fetched: 0, total: 0 });
  const [tracks, setTracks] = useState<NormalizedTrack[]>([]);
  const [fetchWarnings, setFetchWarnings] = useState<TrackWarning[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [options, setOptions] = useState<PlaylistGenerationOptions>(DEFAULT_OPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [preview, setPreview] = useState<PlaylistPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Presets
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets());
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState("");

  const eventSourceRef = useRef<EventSource | null>(null);

  const setOption = useCallback(
    <K extends keyof PlaylistGenerationOptions>(key: K, value: PlaylistGenerationOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // --- Fetch via SSE ---
  const fetchLikedSongs = useCallback(async () => {
    setPhase("fetching");
    setFetchError(null);
    setFetchProgress({ fetched: 0, total: 0 });

    // Close any existing connection
    eventSourceRef.current?.close();

    return new Promise<void>((resolve) => {
      const es = new EventSource("/api/spotify/liked-songs-stream");
      eventSourceRef.current = es;

      es.onmessage = (event: MessageEvent<string>) => {
        let msg: { type: string; [key: string]: unknown };
        try {
          msg = JSON.parse(event.data) as { type: string; [key: string]: unknown };
        } catch {
          return;
        }

        if (msg.type === "progress") {
          setFetchProgress({
            fetched: msg.fetched as number,
            total: msg.total as number,
          });
        } else if (msg.type === "complete") {
          es.close();
          setTracks(msg.tracks as NormalizedTrack[]);
          setFetchWarnings((msg.warnings as TrackWarning[]) ?? []);
          setFetchProgress({
            fetched: msg.totalFetched as number,
            total: msg.totalAvailable as number,
          });
          setPhase("fetched");
          resolve();
        } else if (msg.type === "error") {
          es.close();
          const message = (msg.message as string) ?? "Failed to fetch liked songs";
          if (message === "UNAUTHORIZED") {
            router.push("/?error=Session+expired.+Please+log+in+again.");
          } else {
            setFetchError(message);
            setPhase("idle");
          }
          resolve();
        }
      };

      es.onerror = () => {
        es.close();
        setFetchError("Connection lost while fetching liked songs. Please try again.");
        setPhase("idle");
        resolve();
      };
    });
  }, [router]);

  // --- Enrich with genres if needed ---
  const enrichWithGenres = useCallback(
    async (rawTracks: NormalizedTrack[]): Promise<NormalizedTrack[]> => {
      if (!STRATEGY_NEEDS_GENRES.has(options.strategy)) return rawTracks;

      setPhase("enriching");
      setEnrichProgress({ fetched: 0, total: 0 });

      try {
        const res = await fetch("/api/spotify/artist-genres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: rawTracks }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error((data as { error: string }).error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { tracks: NormalizedTrack[] };
        return data.tracks;
      } catch (err) {
        // Non-fatal: fall back to un-enriched tracks, genre grouper will put all in "Other"
        console.warn("Genre enrichment failed:", err);
        return rawTracks;
      }
    },
    [options.strategy],
  );

  // --- Generate preview ---
  const generatePreview = useCallback(async () => {
    setPhase("previewing");
    setPreviewError(null);

    const enrichedTracks = await enrichWithGenres(tracks);
    if (enrichedTracks !== tracks) {
      setTracks(enrichedTracks); // cache the enriched tracks
    }

    try {
      const res = await fetch("/api/playlists/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: enrichedTracks, warnings: fetchWarnings, options }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((data as { error: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as PlaylistPreview;
      setPreview(data);
      setPhase("previewed");
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Failed to generate preview");
      setPhase("fetched");
    }
  }, [tracks, fetchWarnings, options, enrichWithGenres]);

  // --- Create playlists ---
  const handleCreatePlaylists = useCallback(
    async (groups: PlaylistPreview["groups"]) => {
      setPhase("creating");

      try {
        const res = await fetch("/api/playlists/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups, options }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error((data as { error: string }).error ?? `HTTP ${res.status}`);
        }

        const summary = await res.json();
        sessionStorage.setItem("spotiplay_results", JSON.stringify(summary));
        router.push("/results");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create playlists";
        setPreviewError(message);
        setPhase("previewed");
      }
    },
    [options, router],
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }, [router]);

  // --- Presets ---
  const handleSavePreset = useCallback(() => {
    const name = presetName.trim() || defaultPresetName(options);
    const updated = savePreset(name, options);
    setPresets(updated);
    setPresetName("");
  }, [presetName, options]);

  const handleLoadPreset = useCallback((preset: Preset) => {
    setOptions(preset.options);
    setShowPresets(false);
    setPreview(null);
  }, []);

  const handleDeletePreset = useCallback((name: string) => {
    setPresets(deletePreset(name));
  }, []);

  const progressPct =
    fetchProgress.total > 0
      ? Math.round((fetchProgress.fetched / fetchProgress.total) * 100)
      : 0;

  const isBusy =
    phase === "fetching" ||
    phase === "enriching" ||
    phase === "previewing" ||
    phase === "creating";

  // Pre-computed labels used inside the narrowed JSX branch below.
  // TypeScript narrows `phase` inside the options panel to exclude "enriching",
  // so we derive these outside where all phases are still in scope.
  const previewButtonIcon = isBusy && phase !== "creating" ? "spinner" : "eye";
  const previewButtonLabel =
    phase === "enriching"
      ? "Fetching genres…"
      : phase === "previewing"
        ? "Generating preview…"
        : "Preview playlists";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music2 className="h-7 w-7 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">SpotiPlay</h1>
              <p className="text-sm text-zinc-400">
                Logged in as{" "}
                <span className="font-medium text-zinc-200">{user.displayName}</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>

        {/* Step 1: Fetch */}
        {phase === "idle" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Fetch your liked songs</CardTitle>
              <CardDescription>
                We&apos;ll pull your entire Spotify liked songs library. Progress updates live as we
                go.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fetchError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fetchError}
                </div>
              )}
              <Button onClick={fetchLikedSongs} className="gap-2">
                <Download className="h-4 w-4" />
                Fetch liked songs
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === "fetching" && (
          <Card>
            <CardHeader>
              <CardTitle>Fetching your liked songs…</CardTitle>
              <CardDescription>
                {fetchProgress.total > 0
                  ? `${formatNumber(fetchProgress.fetched)} of ${formatNumber(fetchProgress.total)} tracks loaded`
                  : "Connecting to Spotify…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-zinc-500">
                Please don&apos;t close this tab while we load your library.
              </p>
            </CardContent>
          </Card>
        )}

        {phase === "enriching" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-400" />
                Fetching artist genres…
              </CardTitle>
              <CardDescription>
                Looking up genre data for each unique artist in your library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress
                value={
                  enrichProgress.total > 0
                    ? Math.round((enrichProgress.fetched / enrichProgress.total) * 100)
                    : 0
                }
              />
              <p className="text-xs text-zinc-500">
                This makes one extra API call to Spotify for genre data.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Library summary + options (visible once fetched) */}
        {(phase === "fetched" ||
          phase === "previewing" ||
          phase === "previewed" ||
          phase === "creating") && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Total liked songs" value={formatNumber(tracks.length)} />
              <StatCard
                label="Skipped tracks"
                value={formatNumber(fetchWarnings.length)}
                sub="local or unavailable"
              />
              <StatCard
                label="Playlists preview"
                value={preview ? formatNumber(preview.totalPlaylists) : "—"}
                sub={preview ? "will be created" : "configure below"}
              />
            </div>

            {/* Step 2: Options */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 2 — Choose a split strategy</CardTitle>
                    <CardDescription className="mt-1">
                      Configure how your liked songs will be divided into playlists.
                    </CardDescription>
                  </div>
                  <Settings className="h-5 w-5 text-zinc-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presets toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPresets((p) => !p)}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    Presets{presets.length > 0 ? ` (${presets.length})` : ""}
                  </button>
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      placeholder={defaultPresetName(options)}
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="h-8 max-w-48 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSavePreset}
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      Save preset
                    </Button>
                  </div>
                </div>

                {/* Presets list */}
                {showPresets && presets.length > 0 && (
                  <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
                    {presets.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                          <p className="text-xs text-zinc-500">
                            {STRATEGY_LABELS[p.options.strategy]} ·{" "}
                            {new Date(p.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadPreset(p)}
                            className="h-7 px-2 text-xs"
                          >
                            Load
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(p.name)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showPresets && presets.length === 0 && (
                  <p className="text-sm text-zinc-500">No saved presets yet.</p>
                )}

                {/* Strategy */}
                <div className="space-y-2">
                  <Label>Split strategy</Label>
                  <Select
                    value={options.strategy}
                    onValueChange={(v) => {
                      setOption("strategy", v as GroupingStrategy);
                      setPreview(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STRATEGY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    {STRATEGY_DESCRIPTIONS[options.strategy]}
                  </p>
                  {STRATEGY_NEEDS_GENRES.has(options.strategy) && (
                    <p className="flex items-center gap-1.5 text-xs text-purple-400">
                      <Tag className="h-3 w-3" />
                      Genre mode fetches artist data from Spotify before previewing — may take a
                      moment for large libraries.
                    </p>
                  )}
                </div>

                {/* Naming prefix */}
                <div className="space-y-2">
                  <Label htmlFor="naming-prefix">Playlist name prefix</Label>
                  <Input
                    id="naming-prefix"
                    value={options.namingPrefix}
                    onChange={(e) => setOption("namingPrefix", e.target.value)}
                    placeholder="Liked Songs"
                    maxLength={50}
                  />
                  <p className="text-xs text-zinc-500">
                    e.g. &quot;Liked Songs — 2020s&quot; or &quot;My Library — Taylor Swift&quot;
                  </p>
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public playlists</Label>
                    <p className="text-xs text-zinc-500">Off = private (recommended)</p>
                  </div>
                  <Switch
                    checked={options.visibility === "public"}
                    onCheckedChange={(v) => setOption("visibility", v ? "public" : "private")}
                  />
                </div>

                {/* Advanced */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((p) => !p)}
                  className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Advanced options
                </button>

                {showAdvanced && (
                  <div className="space-y-4 border-t border-zinc-800 pt-4">
                    {options.strategy === "chunk" && (
                      <div className="space-y-2">
                        <Label htmlFor="chunk-size">Songs per playlist</Label>
                        <Input
                          id="chunk-size"
                          type="number"
                          min={10}
                          max={500}
                          value={options.chunkSize}
                          onChange={(e) =>
                            setOption("chunkSize", parseInt(e.target.value) || 100)
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Skip small groups</Label>
                        <p className="text-xs text-zinc-500">
                          Skip groups with fewer than {options.minimumTracks} tracks
                        </p>
                      </div>
                      <Switch
                        checked={options.skipSmallGroups}
                        onCheckedChange={(v) => setOption("skipSmallGroups", v)}
                      />
                    </div>

                    {options.skipSmallGroups && (
                      <div className="space-y-2">
                        <Label htmlFor="min-tracks">Minimum tracks per group</Label>
                        <Input
                          id="min-tracks"
                          type="number"
                          min={1}
                          max={50}
                          value={options.minimumTracks}
                          onChange={(e) =>
                            setOption("minimumTracks", parseInt(e.target.value) || 3)
                          }
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sort tracks by</Label>
                        <Select
                          value={options.sort.field}
                          onValueChange={(v) =>
                            setOption("sort", { ...options.sort, field: v as SortField })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="likedDate">Date liked</SelectItem>
                            <SelectItem value="releaseDate">Release date</SelectItem>
                            <SelectItem value="trackName">Track name</SelectItem>
                            <SelectItem value="artistName">Artist name</SelectItem>
                            <SelectItem value="albumName">Album name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Order</Label>
                        <Select
                          value={options.sort.order}
                          onValueChange={(v) =>
                            setOption("sort", { ...options.sort, order: v as SortOrder })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Newest first</SelectItem>
                            <SelectItem value="asc">Oldest first</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Deduplicate tracks</Label>
                        <p className="text-xs text-zinc-500">
                          Remove duplicate URIs within playlists
                        </p>
                      </div>
                      <Switch
                        checked={options.deduplicateUris}
                        onCheckedChange={(v) => setOption("deduplicateUris", v)}
                      />
                    </div>
                  </div>
                )}

                {previewError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {previewError}
                  </div>
                )}

                <Button onClick={generatePreview} disabled={isBusy} className="gap-2">
                  {previewButtonIcon === "spinner" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {previewButtonLabel}
                </Button>
              </CardContent>
            </Card>

            {/* Step 3: Preview */}
            {preview && (
              <PreviewPanel
                preview={preview}
                onCreatePlaylists={handleCreatePlaylists}
                isCreating={phase === "creating"}
              />
            )}
          </>
        )}

        {/* Fetch warnings */}
        {fetchWarnings.length > 0 &&
          phase !== "idle" &&
          phase !== "fetching" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {fetchWarnings.length} tracks skipped during import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {fetchWarnings.slice(0, 20).map((w, i) => (
                    <p key={i} className="text-xs text-zinc-500">
                      {w.message}
                    </p>
                  ))}
                  {fetchWarnings.length > 20 && (
                    <p className="text-xs text-zinc-600">
                      …and {fetchWarnings.length - 20} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold text-zinc-100">{value}</div>
        <div className="mt-1 text-sm font-medium text-zinc-300">{label}</div>
        {sub && <div className="text-xs text-zinc-500">{sub}</div>}
      </CardContent>
    </Card>
  );
}
