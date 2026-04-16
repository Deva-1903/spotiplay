"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaylistCreationSummary, PlaylistCreateResult } from "@/lib/spotify/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDate } from "@/lib/utils/format";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Music2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

function readSummaryFromSession(): PlaylistCreationSummary | null {
  try {
    const raw = sessionStorage.getItem("spotiplay_results");
    return raw ? (JSON.parse(raw) as PlaylistCreationSummary) : null;
  } catch {
    return null;
  }
}

export function ResultsClient() {
  const router = useRouter();
  // Lazy initializer: runs once on mount (client-side only). Returns null during SSR.
  const [summary] = useState<PlaylistCreationSummary | null>(() =>
    typeof window !== "undefined" ? readSummaryFromSession() : null,
  );
  const redirected = useRef(false);

  // Redirect to dashboard if no results data is found — effect is only for navigation, not state
  useEffect(() => {
    if (!summary && !redirected.current) {
      redirected.current = true;
      router.replace("/dashboard");
    }
  }, [summary, router]);

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-500">Loading results…</div>
      </div>
    );
  }

  const succeeded = summary.results.filter((r) => r.success);
  const failed = summary.results.filter((r) => !r.success);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Music2 className="h-7 w-7 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Playlists Created</h1>
            <p className="text-sm text-zinc-400">
              Generated on {formatDate(summary.createdAt)}
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">
                {formatNumber(summary.succeeded)}
              </div>
              <div className="mt-1 text-sm text-zinc-400">Playlists created</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-zinc-100">
                {formatNumber(succeeded.reduce((sum, r) => sum + r.tracksAdded, 0))}
              </div>
              <div className="mt-1 text-sm text-zinc-400">Total tracks added</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${failed.length > 0 ? "text-red-400" : "text-zinc-600"}`}>
                {formatNumber(summary.failed)}
              </div>
              <div className="mt-1 text-sm text-zinc-400">Playlists failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Success banner */}
        {failed.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-400">All playlists created successfully!</p>
              <p className="text-sm text-zinc-400">Open Spotify to see your new playlists.</p>
            </div>
          </div>
        )}

        {failed.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="font-semibold text-yellow-400">
                {summary.succeeded} of {summary.totalPlaylists} playlists created
              </p>
              <p className="text-sm text-zinc-400">
                {failed.length} playlist(s) failed. See details below.
              </p>
            </div>
          </div>
        )}

        {/* Succeeded playlists */}
        {succeeded.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-zinc-200">Created playlists</h2>
            {succeeded.map((result) => (
              <ResultRow key={result.groupId} result={result} />
            ))}
          </div>
        )}

        {/* Failed playlists */}
        {failed.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-red-400">Failed playlists</h2>
            {failed.map((result) => (
              <ResultRow key={result.groupId} result={result} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
          <Button
            onClick={() => {
              sessionStorage.removeItem("spotiplay_results");
              router.push("/dashboard");
            }}
            className="gap-2"
          >
            <Music2 className="h-4 w-4" />
            Create another split
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: PlaylistCreateResult }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
        result.success
          ? "border-zinc-800 bg-zinc-900"
          : "border-red-500/20 bg-red-500/5"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {result.success ? (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100">{result.title}</p>
          {result.success ? (
            <p className="text-xs text-zinc-500">
              {formatNumber(result.tracksAdded)} track{result.tracksAdded !== 1 ? "s" : ""} added
              {result.tracksFailed > 0 &&
                ` · ${result.tracksFailed} failed to add`}
            </p>
          ) : (
            <p className="text-xs text-red-400 truncate">{result.error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Badge variant={result.success ? "default" : "destructive"}>
          {result.success ? "Created" : "Failed"}
        </Badge>
        {result.spotifyPlaylistUrl && (
          <a
            href={result.spotifyPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
