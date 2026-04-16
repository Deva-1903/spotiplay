"use client";

import { useState } from "react";
import { PlaylistPreview, GeneratedPlaylistGroup } from "@/lib/spotify/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils/format";
import { ListMusic, AlertCircle, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

interface Props {
  preview: PlaylistPreview;
  onCreatePlaylists: (groups: GeneratedPlaylistGroup[]) => Promise<void>;
  isCreating: boolean;
}

export function PreviewPanel({ preview, onCreatePlaylists, isCreating }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
}: {
  group: GeneratedPlaylistGroup;
  isExpanded: boolean;
  onToggle: () => void;
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
              <div key={track.id} className="flex items-center gap-3">
                {track.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.imageUrl}
                    alt={track.albumName}
                    className="h-9 w-9 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{track.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {track.primaryArtist} · {track.albumName}
                    {track.releaseYear ? ` · ${track.releaseYear}` : ""}
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0 text-xs text-zinc-600">
                  {formatDate(track.addedAt)}
                </div>
              </div>
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
