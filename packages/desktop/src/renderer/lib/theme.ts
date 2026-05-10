import type { DiffsThemeNames } from "@pierre/diffs/react";

export type AppTheme = {
  name: string;
  diff: DiffsThemeNames;
};

export const THEMES = {
  dracula: { name: "Dracula", diff: "dracula" },
  draculaSoft: { name: "Dracula Soft", diff: "dracula-soft" },
  githubDark: { name: "GitHub Dark", diff: "github-dark" },
  tokyoNight: { name: "Tokyo Night", diff: "tokyo-night" },
} as const satisfies Record<string, AppTheme>;

export type ThemeKey = keyof typeof THEMES;

const STORAGE_KEY = "opentui-git.theme";
const DEFAULT_THEME: ThemeKey = "dracula";

function readStoredKey(): ThemeKey {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw in THEMES) return raw as ThemeKey;
  } catch {
    // localStorage unavailable in this context; fall through to default
  }
  return DEFAULT_THEME;
}

export const ACTIVE_THEME_KEY: ThemeKey = readStoredKey();
export const ACTIVE_THEME: AppTheme = THEMES[ACTIVE_THEME_KEY];

// The diff highlighter worker pool is a module-level singleton, so the theme
// can only be applied at startup. Persist the choice and reload to apply.
export function setActiveTheme(key: ThemeKey) {
  if (key === ACTIVE_THEME_KEY) return;
  localStorage.setItem(STORAGE_KEY, key);
  window.location.reload();
}
