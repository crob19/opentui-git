import simpleGit, { SimpleGit, StatusResult, BranchSummary, LogResult, MergeResult } from "simple-git";
import type { GitFileStatus, GitStatusSummary, GitBranchInfo, GitCommitInfo } from "./types.js";
import { STATUS_COLORS, GitStatus } from "./types.js";
import { logger } from "./utils/logger.js";

/**
 * GitService - Wrapper class for git operations using simple-git
 * Provides a clean interface for common git operations needed by the TUI
 */
export class GitService {
  private git: SimpleGit;

  /**
   * Creates a new GitService instance
   * @param repoPath - Path to the git repository (defaults to current directory)
   */
  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
  }

  /**
   * Check if the current directory is a git repository
   * @returns Promise<boolean> - True if in a git repository
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current repository status
   * @returns Promise<GitStatusSummary> - Formatted status summary
   */
  async getStatus(): Promise<GitStatusSummary> {
    const status: StatusResult = await this.git.status();
    
    logger.debug("Git status.current:", status.current);
    
    const files: GitFileStatus[] = [];
    const processedFiles = new Set<string>();

    // Process modified files (may be staged or unstaged)
    for (const file of status.modified) {
      const staged = status.staged.includes(file);
      files.push(this.createFileStatus(file, staged, "M"));
      processedFiles.add(file);
    }

    // Process deleted files
    for (const file of status.deleted) {
      const staged = status.staged.includes(file);
      files.push(this.createFileStatus(file, staged, "D"));
      processedFiles.add(file);
    }

    // Process renamed files
    for (const file of status.renamed) {
      const filePath = file.to || file.from;
      files.push(this.createFileStatus(filePath, true, "R"));
      processedFiles.add(filePath);

      // Ensure both old and new paths are marked as processed to avoid duplicates
      if (file.from && file.from !== filePath) {
        processedFiles.add(file.from);
      }
      if (file.to && file.to !== filePath) {
        processedFiles.add(file.to);
      }
    }

    // Process files in the staging area that weren't already processed
    // (these are newly added files, not modifications)
    for (const file of status.staged) {
      if (!processedFiles.has(file)) {
        files.push(this.createFileStatus(file, true, "A"));
        processedFiles.add(file);
      }
    }

    // Process untracked files
    for (const file of status.not_added) {
      if (!processedFiles.has(file)) {
        files.push(this.createFileStatus(file, false, "?"));
        processedFiles.add(file);
      }
    }

    // Process conflicted files
    for (const file of status.conflicted) {
      if (!processedFiles.has(file)) {
        files.push(this.createFileStatus(file, false, "U"));
        processedFiles.add(file);
      }
    }

    return {
      current: status.current || "HEAD",
      ahead: status.ahead,
      behind: status.behind,
      files,
      isClean: status.isClean(),
    };
  }

  /**
   * Create a formatted file status object
   * @private
   */
  private createFileStatus(
    path: string,
    staged: boolean,
    statusCode: string
  ): GitFileStatus {
    let statusText = "";
    let color: string = STATUS_COLORS.DEFAULT;

    switch (statusCode) {
      case GitStatus.MODIFIED:
        statusText = "Modified";
        color = STATUS_COLORS.MODIFIED;
        break;
      case GitStatus.ADDED:
        statusText = "Added";
        color = STATUS_COLORS.ADDED;
        break;
      case GitStatus.DELETED:
        statusText = "Deleted";
        color = STATUS_COLORS.DELETED;
        break;
      case GitStatus.RENAMED:
        statusText = "Renamed";
        color = STATUS_COLORS.RENAMED;
        break;
      case GitStatus.COPIED:
        statusText = "Copied";
        color = STATUS_COLORS.COPIED;
        break;
      case GitStatus.UNTRACKED:
        statusText = "Untracked";
        color = STATUS_COLORS.UNTRACKED;
        break;
      case GitStatus.UNMERGED:
        statusText = "Conflict";
        color = STATUS_COLORS.UNMERGED;
        break;
      default:
        statusText = "Unknown";
    }

    return {
      path,
      working_dir: statusCode,
      index: staged ? statusCode : " ",
      staged,
      statusText,
      color,
    };
  }

  /**
   * Stage a specific file
   * @param filepath - Path to the file to stage
   */
  async stageFile(filepath: string): Promise<void> {
    await this.git.add(filepath);
  }

  /**
   * Unstage a specific file
   * @param filepath - Path to the file to unstage
   */
  async unstageFile(filepath: string): Promise<void> {
    await this.git.reset(["HEAD", "--", filepath]);
  }

  /**
   * Stage all changes
   */
  async stageAll(): Promise<void> {
    await this.git.add(".");
  }

  /**
   * Unstage all changes
   */
  async unstageAll(): Promise<void> {
    await this.git.reset(["HEAD"]);
  }

  /**
   * Get branch information
   * @returns Promise<GitBranchInfo> - Branch information
   */
  async getBranches(): Promise<GitBranchInfo> {
    const branches: BranchSummary = await this.git.branch();
    
    return {
      current: branches.current,
      all: branches.all,
      branches: branches.branches,
    };
  }

  /**
   * Get commit history
   * @param limit - Maximum number of commits to retrieve
   * @returns Promise<GitCommitInfo[]> - Array of commit information
   */
  async getCommits(limit: number = 50): Promise<GitCommitInfo[]> {
    const log: LogResult = await this.git.log({ maxCount: limit });
    
    return log.all.map((commit) => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author_name: commit.author_name,
      author_email: commit.author_email,
    }));
  }

  /**
   * Create a commit with the given message
   * @param message - Commit message
   * @returns Promise<string> - Commit hash
   */
  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  /**
   * Get the diff for a specific file
   * @param filepath - Path to the file
   * @param staged - Whether to get staged or unstaged diff
   * @returns Promise<string> - Diff output
   */
  async getDiff(filepath: string, staged: boolean = false): Promise<string> {
    const options = staged ? ["--cached", filepath] : [filepath];
    return await this.git.diff(options);
  }

  /**
   * Pull from remote
   * @returns Promise<void>
   */
  async pull(): Promise<void> {
    await this.git.pull();
  }

  /**
   * Push to remote
   * Automatically sets upstream for new branches
   * @returns Promise<void>
   */
  async push(): Promise<void> {
    try {
      await this.git.push();
    } catch (error) {
      // If push fails due to no upstream, try with --set-upstream
      if (error instanceof Error && error.message.includes("no upstream branch")) {
        const status = await this.git.status();
        const currentBranch = status.current;
        if (currentBranch) {
          await this.git.push(["--set-upstream", "origin", currentBranch]);
          return;
        }
      }
      throw error;
    }
  }

  /**
   * Checkout a branch
   * @param branchName - Name of the branch to checkout
   */
  async checkoutBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  /**
   * Create a new branch
   * @param branchName - Name of the new branch
   */
  async createBranch(branchName: string): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
  }

  /**
   * Delete a local branch
   * @param branchName - Name of the branch to delete
   * @param force - Force delete even if not fully merged (default: false)
   */
  async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
    const flag = force ? "-D" : "-d";
    await this.git.branch([flag, branchName]);
  }

  /**
   * Merge a branch into the current branch
   * @param branchName - Name of the branch to merge into the current branch
   * @returns Promise<MergeResult> - Result of the merge operation
   */
  async mergeBranch(branchName: string): Promise<MergeResult> {
    return await this.git.merge([branchName]);
  }

  /**
   * Get repository root path
   * @returns Promise<string> - Path to repository root
   */
  async getRepoRoot(): Promise<string> {
    const result = await this.git.revparse(["--show-toplevel"]);
    return result.trim();
  }

  /**
   * Create a lightweight tag at HEAD
   * @param tagName - Name of the tag to create
   */
  async createTag(tagName: string): Promise<void> {
    await this.git.tag([tagName]);
  }

  /**
   * Get all tags in the repository
   * @returns Promise<string[]> - Array of tag names
   */
  async getTags(): Promise<string[]> {
    const tags = await this.git.tags();
    return tags.all;
  }

  /**
   * Get the current commit hash (short format)
   * @returns Promise<string> - Short commit hash
   */
  async getCurrentCommitHash(): Promise<string> {
    const log = await this.git.log({ maxCount: 1 });
    return log.latest?.hash.substring(0, 7) || 'unknown';
  }
}
