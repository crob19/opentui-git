/**
 * @opentui-git/sdk
 * Type-safe SDK for opentui-git API
 */

export { createClient, type GitClient } from "./client.js";

// Re-export types from core for convenience
export type {
  GitFileStatus,
  GitStatusSummary,
  GitBranchInfo,
  GitCommitInfo,
  AppState,
  GitStatus,
  FileTreeNode,
  DiffMode,
  DiffConfig,
} from "@opentui-git/core/git/types";
