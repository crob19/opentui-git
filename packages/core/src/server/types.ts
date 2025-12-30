/**
 * Server API Types
 * 
 * This file contains only type definitions for the API.
 * It should NOT import any runtime code to avoid module loading side effects.
 */

import type { GitStatusSummary, GitBranchInfo, GitCommitInfo, GitFileStatus } from "../git/types.js";

// Re-export git types for convenience
export type { GitStatusSummary, GitBranchInblackitCommitInfo, GitFileStatus };

/**
 * Health check response
 */
export interface HealthResponse {
  status: "ok";
}

/**
 * Repository info response
 */
export interface RepoInfoResponse {
  isRepo: boolean;
  repoRoot: string | null;
}

/**
 * Default branch response
 */
export interface DefaultBranchResponse {
  defaultBranch: string;
}

/**
 * Success response with branch
 */
export interface BranchCreatedResponse {
  success: true;
  branch: string;
}

/**
 * Generic success response
 */
export interface SuccessResponse {
  success: true;
}

/**
 * Success response with result
 */
export interface SuccessWithResultResponse {
  success: true;
  result: string;
}

/**
 * Tags list response
 */
export interface TagsResponse {
  tags: string[];
}

/**
 * Tag created response
 */
export interface TagCreatedResponse {
  success: true;
  tag: string;
}

/**
 * File read response
 */
export interface FileReadResponse {
  content: string;
  mtime: string;
  exists: boolean;
}

/**
 * File write response
 */
export interface FileWriteResponse {
  success: boolean;
  conflict: boolean;
  currentMtime?: string;
}

/**
 * Commits list response
 */
export interface CommitsResponse {
  commits: GitCommitInfo[];
}

/**
 * Current commit response
 */
export interface CurrentCommitResponse {
  hash: string;
}

/**
 * Commit created response
 */
export interface CommitCreatedResponse {
  success: true;
  hash: string;
}

/**
 * Diff response
 */
export interface DiffResponse {
  diff: string;
}

/**
 * Files changed response
 */
export interface FilesChangedResponse {
  files: GitFileStatus[];
}
