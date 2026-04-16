# SpotiPlay — Spotify Liked Songs Playlist Splitter

Split your entire Spotify liked songs library into multiple organized playlists using nine different grouping strategies. Built with Next.js 16, TypeScript, Tailwind CSS, and the Spotify Web API.

## Features

- **Spotify OAuth login** — secure server-side authorization code flow with automatic token refresh
- **Real-time fetch progress** — Server-Sent Events stream per-page progress as your library loads
- **Full library fetch** — paginated fetch of your entire liked songs library (no limit)
- **Nine split strategies:**
  - Fixed-size chunks (e.g., every 100 songs)
  - By primary artist
  - By genre (fetches artist genres from Spotify in batches of 50)
  - By release year
  - By decade (1990s, 2000s, etc.)
  - By month liked
  - By year liked
  - Alphabetical by track name
  - Alphabetical by artist name
- **Preview before creating** — see all groups, track counts, and sample tracks before writing to Spotify
- **Preset saving** — save and reload named option sets via `localStorage`
- **Smart defaults** — private playlists, skip groups < 3 tracks, sort by liked date desc
- **Overflow chunking** — large artist/year/genre groups are automatically split into parts
- **Collision-safe naming** — "Liked Songs — 2020s", "Liked Songs — Taylor Swift — Part 01"
- **Deduplication** — duplicate URIs removed within each playlist
- **Retry + rate limit handling** — exponential backoff, respects `Retry-After` headers
- **Results screen** — links to created playlists, success/failure summary
- **No database** — fully stateless, session stored in an encrypted cookie

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI primitives:** Custom components built on Radix UI
- **Validation:** Zod
- **Session:** iron-session (encrypted cookie)
- **Auth:** Spotify Authorization Code Flow (server-side)
- **Tests:** Vitest
- **Package manager:** pnpm

## Setup

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000/api/auth/callback` to the **Redirect URIs**
4. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
APP_URL=http://localhost:3000
SESSION_SECRET=your_32_char_random_secret
```

Generate a session secret:
```bash
openssl rand -hex 32
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
pnpm test          # run all tests
pnpm test:watch    # watch mode
pnpm test:coverage # with coverage report
```

Tests cover:
- Chunk grouping
- Decade grouping  
- Alphabetical grouping
- Deduplication logic
- Sort stability
- Naming (collisions, overflow parts, article stripping, length capping)
- Engine integration (preview generation)

## Type Checking

```bash
pnpm typecheck
```

## Linting

```bash
pnpm lint        # check
pnpm lint:fix    # auto-fix
```

## Building for Production

```bash
pnpm build
pnpm start
```

## How Spotify Auth Works

1. User clicks "Connect with Spotify"
2. Server generates a random `state` token, stores it in the session cookie, and redirects to Spotify's `/authorize` endpoint
3. Spotify redirects back to `/api/auth/callback?code=...&state=...`
4. Server verifies the `state` matches what's in the session (CSRF protection)
5. Server exchanges the `code` for `access_token` + `refresh_token` using the Client Secret
6. Tokens + user profile are encrypted into the session cookie (via iron-session)
7. On every subsequent API call, if the access token is expired, it is transparently refreshed using the refresh token

Secrets never touch the client. The session cookie is `HttpOnly`, `SameSite=lax`, and `Secure` in production.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Yes | Your Spotify app's client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Your Spotify app's client secret (never exposed to browser) |
| `SPOTIFY_REDIRECT_URI` | Yes | OAuth callback URL — must match what you set in Spotify dashboard |
| `APP_URL` | Yes | Your app's root URL (e.g. `http://localhost:3000`) |
| `SESSION_SECRET` | Yes | At least 32-character random string for cookie encryption |

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "initial commit"
gh repo create spotiplay --private --source . --push
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo
2. Framework preset: **Next.js** (auto-detected)
3. Add all environment variables from the table above:

| Variable | Value |
|---|---|
| `SPOTIFY_CLIENT_ID` | from Spotify dashboard |
| `SPOTIFY_CLIENT_SECRET` | from Spotify dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback` |
| `APP_URL` | `https://your-app.vercel.app` |
| `SESSION_SECRET` | `openssl rand -hex 32` |

4. Deploy

### 3. Update Spotify dashboard

Add your production callback URL to **Redirect URIs** in your Spotify app settings:
```
https://your-app.vercel.app/api/auth/callback
```

### Notes

- The SSE liked-songs fetch route uses `maxDuration = 300` (5 min). Vercel Hobby plan caps at 60s — upgrade to Pro or use the non-streaming `/api/spotify/liked-songs` route for very large libraries.
- `SESSION_SECRET` must be at least 32 characters; generate a fresh one for production.

---

## Current Limitations

- **Large library SSE timeout** — Vercel Hobby plan's 60s function limit may cut off very large libraries (>6 000 tracks). Pro plan extends to 300s.
- **No dry-run export** — JSON export of the preview is not yet implemented.
- **Results lost on hard refresh** — the results page reads from `sessionStorage`; a hard refresh or new tab loses the data (by design — no DB).
- **Single user at a time** — the session is per-user via cookie; no multi-user infrastructure needed for this stateless app.

## Future Improvements

- Dry-run JSON export (download the preview as a file without writing to Spotify)
- Delete playlists created in the last run
- Search/filter within the preview panel
- SSE-based genre enrichment progress (currently a blocking POST; could stream per-artist-batch)
- Spotify for Developers quota extension for production use with many users
- One-click Vercel deployment guide
