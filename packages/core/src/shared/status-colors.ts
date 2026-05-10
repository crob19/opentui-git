/**
 * Status color hex strings used for file-status rendering and tree-color
 * aggregation. Mirrors the values the server emits on FileStatus.color so
 * equality comparisons line up.
 */
export const STATUS_COLORS = {
  MODIFIED: "#FFAA00",
  DELETED: "#FF4444",
  UNTRACKED: "#888888",
  ADDED: "#44FF44",
  RENAMED: "#00AAFF",
  COPIED: "#00AAFF",
  UNMERGED: "#FF00FF",
  BRANCH_ONLY: "#AAAAAA",
  DEFAULT: "#FFFFFF",
} as const;
