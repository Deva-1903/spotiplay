import { PlaylistGenerationOptions } from "@/lib/spotify/types";

const STORAGE_KEY = "spotiplay_presets";
const MAX_PRESETS = 10;

export interface Preset {
  name: string;
  savedAt: string;
  options: PlaylistGenerationOptions;
}

export function loadPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    return [];
  }
}

export function savePreset(name: string, options: PlaylistGenerationOptions): Preset[] {
  const presets = loadPresets().filter((p) => p.name !== name); // replace if same name
  const newPreset: Preset = { name, savedAt: new Date().toISOString(), options };
  const updated = [newPreset, ...presets].slice(0, MAX_PRESETS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deletePreset(name: string): Preset[] {
  const updated = loadPresets().filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function defaultPresetName(options: PlaylistGenerationOptions): string {
  return `${options.namingPrefix} — ${options.strategy}`;
}
