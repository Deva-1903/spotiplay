import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Sortify — Spotify Liked Songs Playlist Splitter",
  description:
    "Split your entire Spotify liked songs library into organized playlists — by artist, genre, decade, year, alphabetical order, or custom rules.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Sortify — Spotify Liked Songs Playlist Splitter",
    description:
      "Split your entire Spotify liked songs library into organized playlists — by artist, genre, decade, year, alphabetical order, or custom rules.",
    type: "website",
    url: APP_URL,
  },
  twitter: {
    card: "summary",
    title: "Sortify — Spotify Liked Songs Playlist Splitter",
    description: "Finally organize your Spotify liked songs into real playlists.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
