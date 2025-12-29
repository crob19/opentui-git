import { treaty } from "@elysiajs/eden";
import type { App } from "@opentui-git/core/server";

/**
 * Create a type-safe API client for opentui-git server
 * Uses Eden treaty for end-to-end type safety with the Elysia backend
 */
export function createClient(baseUrl: string = "http://localhost:4096") {
  const api = treaty<App>(baseUrl);
  
  return {
    /**
     * Health check
     */
    health: async () => {
      const { data, error } = await api.health.get();
      if (error) throw new Error("Health check failed");
      return data;
    },

    /**
     * Get repository status
     */
    getStatus: async () => {
      const { data, error } = await api.status.get();
      if (error) throw new Error("Failed to get status");
      return data;
    },

    /**
     * Check if current directory is a git repository
     */
    getRepoInfo: async () => {
      const { data, error } = await api.status.repo.get();
      if (error) throw new Error("Failed to get repo info");
      return data;
    },

    /**
     * Get all branches
     */
    getBranches: async () => {
      const { data, error } = await api.branches.get();
      if (error) throw new Error("Failed to get branches");
      return data;
    },

    /**
     * Get default branch name
     */
    getDefaultBranch: async () => {
      const { data, error } = await api.branches.default.get();
      if (error) throw new Error("Failed to get default branch");
      return data.defaultBranch;
    },

    /**
     * Create a new branch
     */
    createBranch: async (name: string) => {
      const { data, error } = await api.branches.post({ name });
      if (error) throw new Error(`Failed to create branch: ${name}`);
      return data;
    },

    /**
     * Checkout a branch
     */
    checkoutBranch: async (name: string) => {
      const { data, error } = await api.branches({ name }).checkout.post();
      if (error) throw new Error(`Failed to checkout branch: ${name}`);
      return data;
    },

    /**
     * Merge a branch into current branch
     */
    mergeBranch: async (name: string) => {
      const { data, error } = await api.branches({ name }).merge.post();
      if (error) throw new Error(`Failed to merge branch: ${name}`);
      return data;
    },

    /**
     * Delete a branch
     */
    deleteBranch: async (name: string, force: boolean = false) => {
      const { data, error } = await api.branches({ name }).delete({ query: { force: force.toString() } });
      if (error) throw new Error(`Failed to delete branch: ${name}`);
      return data;
    },

    /**
     * Get all tags
     */
    getTags: async () => {
      const { data, error } = await api.tags.get();
      if (error) throw new Error("Failed to get tags");
      return data.tags;
    },

    /**
     * Create a new tag
     */
    createTag: async (name: string) => {
      const { data, error } = await api.tags.post({ name });
      if (error) throw new Error(`Failed to create tag: ${name}`);
      return data;
    },

    /**
     * Push a tag to remote
     */
    pushTag: async (name: string, remote: string = "origin") => {
      const { data, error } = await api.tags({ name }).push.post({ remote });
      if (error) throw new Error(`Failed to push tag: ${name}`);
      return data;
    },

    /**
     * Stage a file
     */
    stageFile: async (path: string) => {
      const { data, error } = await api.files.stage.post({ path });
      if (error) throw new Error(`Failed to stage file: ${path}`);
      return data;
    },

    /**
     * Unstage a file
     */
    unstageFile: async (path: string) => {
      const { data, error } = await api.files.unstage.post({ path });
      if (error) throw new Error(`Failed to unstage file: ${path}`);
      return data;
    },

    /**
     * Stage all files
     */
    stageAll: async () => {
      const { data, error } = await api.files["stage-all"].post();
      if (error) throw new Error("Failed to stage all files");
      return data;
    },

    /**
     * Unstage all files
     */
    unstageAll: async () => {
      const { data, error } = await api.files["unstage-all"].post();
      if (error) throw new Error("Failed to unstage all files");
      return data;
    },

    /**
     * Read a file with metadata
     */
    readFile: async (path: string) => {
      const { data, error } = await api.files.read.get({ query: { path } });
      if (error) throw new Error(`Failed to read file: ${path}`);
      return data;
    },

    /**
     * Write a file with conflict detection
     */
    writeFile: async (path: string, content: string, expectedMtime?: Date) => {
      const { data, error } = await api.files.write.post({
        path,
        content,
        expectedMtime: expectedMtime?.toISOString(),
      });
      if (error) throw new Error(`Failed to write file: ${path}`);
      return data;
    },

    /**
     * Get commit history
     */
    getCommits: async (limit: number = 50) => {
      const { data, error } = await api.commits.get({ query: { limit: limit.toString() } });
      if (error) throw new Error("Failed to get commits");
      return data.commits;
    },

    /**
     * Get current commit hash
     */
    getCurrentCommitHash: async () => {
      const { data, error } = await api.commits.current.get();
      if (error) throw new Error("Failed to get current commit hash");
      return data.hash;
    },

    /**
     * Create a commit
     */
    commit: async (message: string) => {
      const { data, error } = await api.commits.post({ message });
      if (error) throw new Error("Failed to commit");
      return data.hash;
    },

    /**
     * Get diff for a file
     */
    getDiff: async (path: string, options: { staged?: boolean; branch?: string } = {}) => {
      const query: Record<string, string> = { path };
      if (options.branch) {
        query.branch = options.branch;
      } else if (options.staged !== undefined) {
        query.staged = options.staged.toString();
      }
      const { data, error } = await api.diff.get({ query });
      if (error) throw new Error(`Failed to get diff for: ${path}`);
      return data.diff;
    },

    /**
     * Get files changed against a branch
     */
    getFilesChangedAgainstBranch: async (branch: string) => {
      const { data, error } = await api.diff.files.get({ query: { branch } });
      if (error) throw new Error(`Failed to get files changed against: ${branch}`);
      return data.files;
    },

    /**
     * Pull from remote
     */
    pull: async () => {
      const { data, error } = await api.remote.pull.post();
      if (error) throw new Error("Failed to pull");
      return data;
    },

    /**
     * Push to remote
     */
    push: async () => {
      const { data, error } = await api.remote.push.post();
      if (error) throw new Error("Failed to push");
      return data;
    },

    /**
     * Subscribe to server events (SSE)
     */
    subscribe: () => {
      return api.events.get();
    },
  };
}

/**
 * Type of the SDK client
 */
export type GitClient = ReturnType<typeof createClient>;
