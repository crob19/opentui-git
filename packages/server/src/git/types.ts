/**
 * Status of a single file in the git repository
 */
export interface GitFileStatus {
  path: string;
  workingDir: string;
  index: string;
  staged: boolean;
  statusText: string;
  color: string;
  hasLocalChanges?: boolean | null;
}

/**
 * Summary of the current repository status
 */
export interface GitStatusSummary {
  current: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
  isClean: boolean;
}

/**
 * Git branch information
 */
export interface GitBranchInfo {
  current: string;
  all: string[];
  branches: Array<{
    current: boolean;
    name: string;
    commit: string;
    label: string;
    ahead: number;
    behind: number;
  }>;
}

/**
 * Git commit information
 */
export interface GitCommitInfo {
  hash: string;
  date: string;
  message: string;
  authorName: string;
  authorEmail: string;
}

/**
 * File status codes from git
 */
export enum GitStatus {
  MODIFIED = "M",
  ADDED = "A",
  DELETED = "D",
  RENAMED = "R",
  COPIED = "C",
  UNTRACKED = "?",
  IGNORED = "!",
  UNMERGED = "U",
  UPDATED = " ",
}

/**
 * Color scheme for file statuses (server emits these on FileStatus.color
 * so clients can render without re-deriving status->color mapping).
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
