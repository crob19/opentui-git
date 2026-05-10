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

export const ACTIVE_THEME: AppTheme = THEMES.dracula;
