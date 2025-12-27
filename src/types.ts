

/**
 * Represents the status of a single file in the git repository
 */
export interface GitFileStatus {
  /** Relative path to the file */
  path: string;
  /** Working directory status (modified, deleted, etc.) */
  working_dir: string;
  /** Index/staging area status */
  index: string;
  /** Whether the file is staged */
  staged: boolean;
  /** Display status text (Modified, Deleted, Untracked, etc.) */
  statusText: string;
  /** Color for terminal display */
  color: string;
}

/**
 * Summary of the current repository status
 */
export interface GitStatusSummary {
  /** Current branch name */
  current: string;
  /** Number of commits ahead of remote */
  ahead: number;
  /** Number of commits behind remote */
  behind: number;
  /** Array of file statuses */
  files: GitFileStatus[];
  /** Whether there are changes to commit */
  isClean: boolean;
}

/**
 * Git branch information
 */
export interface GitBranchInfo {
  /** Current branch name */
  current: string;
  /** All branch names */
  all: string[];
  /** Branches on remote */
  branches: Record<string, {
    current: boolean;
    name: string;
    commit: string;
    label: string;
  }>;
}

/**
 * Git commit information
 */
export interface GitCommitInfo {
  /** Commit hash */
  hash: string;
  /** Commit date */
  date: string;
  /** Commit message */
  message: string;
  /** Author name */
  author_name: string;
  /** Author email */
  author_email: string;
}

/**
 * Application state
 */
export interface AppState {
  /** Current git status */
  status: GitStatusSummary | null;
  /** Currently selected file index */
  selectedIndex: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the app is in a git repository */
  isGitRepo: boolean;
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
 * Color scheme for file statuses
 */
export const STATUS_COLORS = {
  MODIFIED: "#FFAA00",    // Yellow/Orange
  DELETED: "#FF4444",     // Red
  UNTRACKED: "#888888",   // Gray
  ADDED: "#44FF44",       // Green
  RENAMED: "#00AAFF",     // Blue
  COPIED: "#00AAFF",      // Blue
  UNMERGED: "#FF00FF",    // Magenta
  DEFAULT: "#FFFFFF",     // White
} as const;

/**
 * File tree node - represents either a file or folder in the tree
 */
export interface FileTreeNode {
  /** Node type */
  type: 'file' | 'folder';
  /** Display name (just the filename/folder name, not full path) */
  name: string;
  /** Full path from repository root */
  path: string;
  /** Indentation depth in the tree */
  depth: number;
  /** Whether the folder is expanded (only for folders) */
  expanded?: boolean;
  /** Child nodes (only for folders) */
  children?: FileTreeNode[];
  /** File status information (only for files) */
  fileStatus?: GitFileStatus;
  /** Aggregated color for folders based on child statuses */
  color?: string;
}

/**
 * Diff display modes
 */
export type DiffMode = "unstaged" | "staged" | "branch";

/**
 * Configuration for diff viewing
 */
export interface DiffConfig {
  /** Current diff mode */
  mode: DiffMode;
  /** Branch to compare against (only used when mode is "branch") */
  compareBranch: string | null;
}
