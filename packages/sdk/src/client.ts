/**
 * Git Client SDK
 * 
 * A standalone HTTP client for the opentui-git server.
 * Imports type definitions from core to maintain a single source of truth.
 * Only type imports are used to avoid any runtime module loading side effects.
 */

import type {
  GitFileStatus,
  GitStatusSummary,
  GitBranchInfo,
  GitCommitInfo,
} from "@opentui-git/core/git/types";

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
  message?: string;
}

/**
 * Merge result from simple-git
 */
export interface MergeResult {
  conflicts: string[];
  merges: string[];
  result: string;
  readonly failed: boolean;
  files: string[];
}

/**
 * Simple fetch wrapper with error handling
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Create a type-safe API client for opentui-git server
 */
export function createClient(baseUrl: string = "http://localhost:5050") {
  const url = (path: string) => `${baseUrl}${path}`;
  
  return {
    /**
     * Health check
     */
    health: async () => {
      return fetchJson<{ status: "ok" }>(url("/health"));
    },

    /**
     * Get repository status
     */
    getStatus: async () => {
      return fetchJson<GitStatusSummary>(url("/status"));
    },

    /**
     * Check if current directory is a git repository
     */
    getRepoInfo: async () => {
      return fetchJson<{ isRepo: boolean; repoRoot: string | null }>(url("/status/repo"));
    },

    /**
     * Get all branches
     */
    getBranches: async () => {
      return fetchJson<GitBranchInfo>(url("/branches"));
    },

    /**
     * Get default branch name
     */
    getDefaultBranch: async () => {
      const data = await fetchJson<{ defaultBranch: string }>(url("/branches/default"));
      return data.defaultBranch;
    },

    /**
     * Create a new branch
     */
    createBranch: async (name: string) => {
      return fetchJson<{ success: true; branch: string }>(url("/branches"), {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },

    /**
     * Checkout a branch
     */
    checkoutBranch: async (name: string) => {
      return fetchJson<{ success: true }>(url(`/branches/${encodeURIComponent(name)}/checkout`), {
        method: "POST",
      });
    },

    /**
     * Merge a branch into current branch
     */
    mergeBranch: async (name: string) => {
      return fetchJson<{ success: true; result: MergeResult }>(url(`/branches/${encodeURIComponent(name)}/merge`), {
        method: "POST",
      });
    },

    /**
     * Delete a branch
     */
    deleteBranch: async (name: string, force: boolean = false) => {
      return fetchJson<{ success: true }>(url(`/branches/${encodeURIComponent(name)}?force=${force}`), {
        method: "DELETE",
      });
    },

    /**
     * Get all tags
     */
    getTags: async () => {
      const data = await fetchJson<{ tags: string[] }>(url("/tags"));
      return data.tags;
    },

    /**
     * Create a new tag
     */
    createTag: async (name: string) => {
      return fetchJson<{ success: true; tag: string }>(url("/tags"), {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },

    /**
     * Push a tag to remote
     */
    pushTag: async (name: string, remote: string = "origin") => {
      return fetchJson<{ success: true }>(url(`/tags/${encodeURIComponent(name)}/push`), {
        method: "POST",
        body: JSON.stringify({ remote }),
      });
    },

    /**
     * Stage a file
     */
    stageFile: async (path: string) => {
      return fetchJson<{ success: true }>(url("/files/stage"), {
        method: "POST",
        body: JSON.stringify({ path }),
      });
    },

    /**
     * Unstage a file
     */
    unstageFile: async (path: string) => {
      return fetchJson<{ success: true }>(url("/files/unstage"), {
        method: "POST",
        body: JSON.stringify({ path }),
      });
    },

    /**
     * Stage all files
     */
    stageAll: async () => {
      return fetchJson<{ success: true }>(url("/files/stage-all"), {
        method: "POST",
      });
    },

    /**
     * Unstage all files
     */
    unstageAll: async () => {
      return fetchJson<{ success: true }>(url("/files/unstage-all"), {
        method: "POST",
      });
    },

    /**
     * Read a file with metadata
     */
    readFile: async (path: string) => {
      return fetchJson<FileReadResponse>(url(`/files/read?path=${encodeURIComponent(path)}`));
    },

    /**
     * Write a file with conflict detection
     */
    writeFile: async (path: string, content: string, expectedMtime?: Date) => {
      return fetchJson<FileWriteResponse>(url("/files/write"), {
        method: "POST",
        body: JSON.stringify({
          path,
          content,
          expectedMtime: expectedMtime?.toISOString(),
        }),
      });
    },

    /**
     * Get commit history
     */
    getCommits: async (limit: number = 50) => {
      const data = await fetchJson<{ commits: GitCommitInfo[] }>(url(`/commits?limit=${limit}`));
      return data.commits;
    },

    /**
     * Get current commit hash
     */
    getCurrentCommitHash: async () => {
      const data = await fetchJson<{ hash: string }>(url("/commits/current"));
      return data.hash;
    },

    /**
     * Create a commit
     */
    commit: async (message: string) => {
      const data = await fetchJson<{ success: true; hash: string }>(url("/commits"), {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      return data.hash;
    },

    /**
     * Get diff for a file
     */
    getDiff: async (path: string, options: { staged?: boolean; branch?: string } = {}) => {
      const params = new URLSearchParams({ path });
      if (options.branch) {
        params.set("branch", options.branch);
      } else if (options.staged !== undefined) {
        params.set("staged", options.staged.toString());
      }
      const data = await fetchJson<{ diff: string }>(url(`/diff?${params}`));
      return data.diff;
    },

    /**
     * Get files changed against a branch
     */
    getFilesChangedAgainstBranch: async (branch: string) => {
      const data = await fetchJson<{ files: GitFileStatus[] }>(url(`/diff/files?branch=${encodeURIComponent(branch)}`));
      return data.files;
    },

    /**
     * Pull from remote
     */
    pull: async () => {
      return fetchJson<{ success: true }>(url("/remote/pull"), {
        method: "POST",
      });
    },

    /**
     * Push to remote
     */
    push: async () => {
      return fetchJson<{ success: true }>(url("/remote/push"), {
        method: "POST",
      });
    },

    /**
     * Subscribe to server events (SSE)
     * Returns a fetch response for SSE stream
     */
    subscribe: async () => {
      return fetch(`${baseUrl}/events`);
    },
  };
}

/**
 * Type of the SDK client
 */
export type GitClient = ReturnType<typeof createClient>;
