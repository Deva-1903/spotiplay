"use client";

import { useState } from "react";
import { PlaylistPreview, GeneratedPlaylistGroup, NormalizedTrack } from "@/lib/spotify/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils/format";
import { ListMusic, AlertCircle, ChevronDown, ChevronUp, Loader2, Sparkles, Info } from "lucide-react";
import type { GenreClassification } from "@/lib/genre/types";

interface Props {
  preview: PlaylistPreview;
  strategy?: string;
  onCreatePlaylists: (groups: GeneratedPlaylistGroup[]) => Promise<void>;
  isCreating: boolean;
}

export function PreviewPanel({ preview, strategy, onCreatePlaylists, isCreating }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const isGenreStrategy = strategy === "genre";

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            Step 3 — Preview
          </CardTitle>
          <CardDescription>
            Review what will be created before writing anything to Spotify.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm md:grid-cols-4">
            <PreviewStat label="Total liked songs" value={formatNumber(preview.totalLikedSongs)} />
            <PreviewStat label="Valid tracks" value={formatNumber(preview.totalValidTracks)} />
            <PreviewStat
              label="Duplicates removed"
              value={formatNumber(preview.totalSkippedTracks)}
            />
            <PreviewStat
              label="Playlists to create"
              value={formatNumber(preview.totalPlaylists)}
              highlight
            />
          </div>

          {preview.skippedGroups.length > 0 && (
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="mb-2 text-sm font-medium text-yellow-400">
                {preview.skippedGroups.length} small group(s) will be skipped:
              </p>
              <div className="space-y-1">
                {preview.skippedGroups.map((g, i) => (
                  <p key={i} className="text-xs text-zinc-500">
                    &ldquo;{g.title}&rdquo; — {g.trackCount} track(s) ({g.reason})
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={() => onCreatePlaylists(preview.groups)}
              disabled={isCreating || preview.totalPlaylists === 0}
              size="lg"
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating playlists…
                </>
              ) : (
                <>
                  <ListMusic className="h-4 w-4" />
                  Create {formatNumber(preview.totalPlaylists)} playlist
                  {preview.totalPlaylists !== 1 ? "s" : ""} in Spotify
                </>
              )}
            </Button>
            {preview.totalPlaylists === 0 && (
              <p className="text-sm text-zinc-500">
                No playlists to create. Try adjusting your options.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-zinc-200">
          Playlists preview ({formatNumber(preview.totalPlaylists)})
        </h3>
        {preview.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isExpanded={expandedGroups.has(group.id)}
            onToggle={() => toggleGroup(group.id)}
            showGenreDetails={isGenreStrategy}
          />
        ))}
      </div>
    </div>
  );
}

function GroupCard({
  group,
  isExpanded,
  onToggle,
  showGenreDetails,
}: {
  group: GeneratedPlaylistGroup;
  isExpanded: boolean;
  onToggle: () => void;
  showGenreDetails: boolean;
}) {
  const sampleTracks = group.tracks.slice(0, 5);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10">
            <ListMusic className="h-5 w-5 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-100">{group.title}</p>
            <p className="text-xs text-zinc-500 truncate">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <Badge variant="secondary">{formatNumber(group.trackCount)} tracks</Badge>
          {group.warnings.length > 0 && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Sample tracks (first {Math.min(5, group.trackCount)} of {group.trackCount})
          </p>
          <div className="space-y-2">
            {sampleTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                showGenreDetails={showGenreDetails}
              />
            ))}
            {group.trackCount > 5 && (
              <p className="text-xs text-zinc-600">
                …and {formatNumber(group.trackCount - 5)} more tracks
              </p>
            )}
          </div>

          {group.warnings.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-3">
              <p className="mb-1 text-xs font-medium text-yellow-500">Warnings:</p>
              {group.warnings.map((w, i) => (
                <p key={i} className="text-xs text-zinc-500">
                  {w.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrackRow({
  track,
  showGenreDetails,
}: {
  track: NormalizedTrack;
  showGenreDetails: boolean;
}) {
  const [showRationale, setShowRationale] = useState(false);
  const gc = track.genreClassification;

  return (
    <div className="rounded-lg">
      <div className="flex items-center gap-3">
        {track.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.imageUrl}
            alt={track.albumName}
            className="h-9 w-9 flex-shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-200">{track.name}</p>
          <p className="truncate text-xs text-zinc-500">
            {track.primaryArtist} · {track.albumName}
            {track.releaseYear ? ` · ${track.releaseYear}` : ""}
          </p>
        </div>

        {showGenreDetails && gc ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ConfidenceBadge confidence={gc.confidence} />
            <SourceBadge source={gc.source} />
            <button
              type="button"
              onClick={() => setShowRationale((v) => !v)}
              className="rounded p-1 text-zinc-600 hover:text-zinc-400"
              title="Show classification rationale"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="ml-auto shrink-0 text-xs text-zinc-600">
            {formatDate(track.addedAt)}
          </div>
        )}
      </div>

      {showGenreDetails && gc && showRationale && (
        <div className="mt-1.5 ml-12 rounded-md border border-zinc-700/50 bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-400">{gc.rationale}</p>
          {gc.signals.normalizedArtistGenres.length > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              Artist tags: {gc.signals.normalizedArtistGenres.slice(0, 5).join(", ")}
            </p>
          )}
          {gc.secondaryGenres.length > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              Also: {gc.secondaryGenres.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  let colorClass = "bg-green-500/15 text-green-400 border-green-500/30";
  if (pct < 55) colorClass = "bg-red-500/15 text-red-400 border-red-500/30";
  else if (pct < 75) colorClass = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      {pct}%
    </span>
  );
}

function SourceBadge({ source }: { source: GenreClassification["source"] }) {
  const configs = {
    rules: { label: "Rules", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    heuristics: { label: "Hints", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    ai: { label: "AI", color: "bg-green-500/15 text-green-400 border-green-500/30" },
    fallback: { label: "Guess", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  } as const;

  const { label, color } = configs[source];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}
    >
      {label}
    </span>
  );
}

function PreviewStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-green-500/30 bg-green-500/5" : "border-zinc-800"}`}>
      <div className={`text-2xl font-bold ${highlight ? "text-green-400" : "text-zinc-100"}`}>
        {value}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
