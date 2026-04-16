import { Music2, Shuffle, ListMusic, Sparkles, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="h-6 w-6 text-green-500" />
            <span className="text-lg font-bold text-zinc-100">SpotiPlay</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400">
            <Sparkles className="h-3.5 w-3.5" />
            Free · No database · Your data stays in Spotify
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-100 md:text-6xl">
            Your liked songs,
            <br />
            <span className="text-green-500">finally organized.</span>
          </h1>

          <p className="mb-10 text-xl text-zinc-400">
            Connect Spotify, fetch your entire liked songs library, and split it into beautifully
            organized playlists — by artist, decade, year, alphabetical order, or any custom rule
            you define.
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {decodeURIComponent(error)}
            </div>
          )}

          <a href="/api/auth/login">
            <Button size="lg" className="gap-3 px-8 py-6 text-base">
              <SpotifyIcon />
              Connect with Spotify
            </Button>
          </a>

          <p className="mt-4 text-xs text-zinc-600">
            We only request permission to read your library and create playlists. Nothing else.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-100">
            Eight ways to split your library
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Shuffle className="h-5 w-5 text-green-500" />}
              title="Fixed Size Chunks"
              description="Every 50, 100, or 200 songs — simple and predictable."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5 text-purple-500" />}
              title="By Artist"
              description="One playlist per artist. A minimum track threshold prevents tiny useless playlists."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              title="By Decade"
              description="1970s, 1980s, 1990s, 2000s, 2010s, 2020s — the classics separated from the new."
            />
            <FeatureCard
              icon={<ListMusic className="h-5 w-5 text-orange-500" />}
              title="By Release Year"
              description="One playlist per year. Perfect for year-in-review nostalgia."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-pink-500" />}
              title="By Date Liked"
              description="Group by month or year you added songs to your library."
            />
            <FeatureCard
              icon={<ListMusic className="h-5 w-5 text-yellow-500" />}
              title="Alphabetical"
              description="A–Z by track or artist name. Non-letter characters go to #."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-100">How it works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: "01", title: "Connect", desc: "Log in with Spotify using secure OAuth" },
              { step: "02", title: "Fetch", desc: "We pull your entire liked songs library" },
              {
                step: "03",
                title: "Preview",
                desc: "Choose a strategy and see the split before creating",
              },
              {
                step: "04",
                title: "Create",
                desc: "Playlists are created directly in your Spotify account",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mb-4 text-3xl font-bold text-green-500">{s.step}</div>
                <div className="mb-2 text-lg font-semibold text-zinc-100">{s.title}</div>
                <div className="text-sm text-zinc-400">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 px-6 py-20 text-center">
        <a href="/api/auth/login">
          <Button size="lg" className="gap-3 px-8 py-6 text-base">
            <SpotifyIcon />
            Get started — it&apos;s free
          </Button>
        </a>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-sm text-zinc-600">
        SpotiPlay is not affiliated with Spotify AB. Built with Next.js.
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="mb-2 font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
