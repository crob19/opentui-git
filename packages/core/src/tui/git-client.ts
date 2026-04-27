import type { MergeResult } from "simple-git";
import { GitService } from "../git/service.js";

export interface FileReadResponse {
  content: string;
  mtime: string;
  exists: boolean;
}

export interface FileWriteResponse {
  success: boolean;
  conflict: boolean;
  currentMtime?: string;
  message?: string;
}

export function createClient(git: GitService) {
  return {
    getStatus: () => git.getStatus(),

    getRepoInfo: async () => {
      const isRepo = await git.isRepo();
      const repoRoot = isRepo ? await git.getRepoRoot() : null;
      return { isRepo, repoRoot };
    },

    getBranches: () => git.getBranches(),

    getDefaultBranch: () => git.getDefaultBranch(),

    createBranch: async (name: string) => {
      await git.createBranch(name);
      return { success: true as const, branch: name };
    },

    checkoutBranch: async (name: string) => {
      await git.checkoutBranch(name);
      return { success: true as const };
    },

    mergeBranch: async (
      name: string,
    ): Promise<{ success: true; result: MergeResult }> => {
      const result = await git.mergeBranch(name);
      return { success: true, result };
    },

    deleteBranch: async (name: string, force: boolean = false) => {
      await git.deleteBranch(name, force);
      return { success: true as const };
    },

    getTags: () => git.getTags(),

    createTag: async (name: string) => {
      await git.createTag(name);
      return { success: true as const, tag: name };
    },

    pushTag: async (name: string, remote: string = "origin") => {
      await git.pushTag(name, remote);
      return { success: true as const };
    },

    stageFile: async (path: string) => {
      await git.stageFile(path);
      return { success: true as const };
    },

    unstageFile: async (path: string) => {
      await git.unstageFile(path);
      return { success: true as const };
    },

    stageAll: async () => {
      await git.stageAll();
      return { success: true as const };
    },

    unstageAll: async () => {
      await git.unstageAll();
      return { success: true as const };
    },

    readFile: async (path: string): Promise<FileReadResponse> => {
      const { content, mtime } = await git.readFileWithMetadata(path);
      return { content, mtime: mtime.toISOString(), exists: true };
    },

    writeFile: async (
      path: string,
      content: string,
      expectedMtime?: Date,
    ): Promise<FileWriteResponse> => {
      const result = await git.writeFileWithCheck(path, content, expectedMtime);
      return {
        success: result.success,
        conflict: !result.success,
        message: result.message,
      };
    },

    getCommits: (limit: number = 50) => git.getCommits(limit),

    getCurrentCommitHash: () => git.getCurrentCommitHash(),

    commit: (message: string) => git.commit(message),

    getDiff: (
      path: string,
      options: { staged?: boolean; branch?: string } = {},
    ) => {
      if (options.branch) {
        return git.getDiffAgainstBranch(path, options.branch);
      }
      return git.getDiff(path, options.staged ?? false);
    },

    getFilesChangedAgainstBranch: (branch: string) =>
      git.getFilesChangedAgainstBranch(branch),

    pull: async () => {
      await git.pull();
      return { success: true as const };
    },

    push: async () => {
      await git.push();
      return { success: true as const };
    },
  };
}

export type GitClient = ReturnType<typeof createClient>;
