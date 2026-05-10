import type { FileStatus } from "@opentui-git/client";

/**
 * Application state
 */
export interface AppState {
  status: unknown | null;
  selectedIndex: number;
  loading: boolean;
  error: string | null;
  isGitRepo: boolean;
}

/**
 * File tree node - represents either a file or folder in the tree
 */
export interface FileTreeNode {
  type: "file" | "folder";
  name: string;
  path: string;
  depth: number;
  expanded?: boolean;
  children?: FileTreeNode[];
  fileStatus?: FileStatus;
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
  mode: DiffMode;
  compareBranch: string | null;
}
