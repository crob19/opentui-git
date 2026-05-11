import simpleGit, {
  SimpleGit,
  StatusResult,
  BranchSummary,
  LogResult,
  MergeResult,
} from "simple-git";
import type {
  GitFileStatus,
  GitStatusSummary,
  GitBranchInfo,
  GitCommitInfo,
} from "./types.js";
import { STATUS_COLORS, GitStatus } from "./types.js";
import { logger } from "../infra/logger.js";
import { promises as fs } from "fs";
import path from "path";

/**
 * GitService - Wrapper class for git operations using simple-git
 * Provides a clean interface for common git operations needed by the TUI
 */
export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  /**
   * Creates a new GitService instance
   * @param repoPath - Path to the git repository (defaults to current directory)
   */
  constructor(repoPath: string = process.cwd()) {
    logger.debug("[GitService] ========== INIT ==========");
    logger.debug("[GitService] Repo path:", repoPath);
    logger.debug("[GitService] CWD:", process.cwd());
    this.git = simpleGit(repoPath);
    this.repoPath = repoPath;
    logger.debug("[GitService] Initialized with simple-git");
  }

  /**
   * Check if the current directory is a git repository
   * @returns Promise<boolean> - True if in a git repository
   */
  async isRepo(): Promise<boolean> {
    logger.debug("[GitService] isRepo() checking:", this.repoPath);
    try {
      await this.git.status();
      logger.debug("[GitService] isRepo() result: true");
      return true;
    } catch (error) {
      logger.debug("[GitService] isRepo() result: false, error:", error);
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
    statusCode: string,
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
      workingDir: statusCode,
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
   * Stage multiple files in a single git invocation.
   */
  async stageFiles(filepaths: string[]): Promise<void> {
    if (filepaths.length === 0) return;
    await this.git.add(filepaths);
  }

  /**
   * Unstage multiple files in a single git invocation.
   */
  async unstageFiles(filepaths: string[]): Promise<void> {
    if (filepaths.length === 0) return;
    await this.git.reset(["HEAD", "--", ...filepaths]);
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
    const branches: BranchSummary = await this.git.branch(["-a"]);

    return {
      current: branches.current,
      all: branches.all,
      branches: await Promise.all(
        Object.values(branches.branches).map(async (b) => ({
          current: b.current,
          name: b.name,
          commit: b.commit,
          label: b.label,
          ...(this.isRemoteBranch(b.name)
            ? { ahead: 0, behind: 0 }
            : await this.getBranchAheadBehind(b.name)),
        })),
      ),
    };
  }

  private isRemoteBranch(branchName: string): boolean {
    return branchName.startsWith("remotes/");
  }

  private async getBranchAheadBehind(
    branchName: string,
  ): Promise<{ ahead: number; behind: number }> {
    try {
      const upstream = (
        await this.git.raw([
          "rev-parse",
          "--abbrev-ref",
          `${branchName}@{upstream}`,
        ])
      ).trim();

      if (!upstream) return { ahead: 0, behind: 0 };

      const counts = (
        await this.git.raw([
          "rev-list",
          "--left-right",
          "--count",
          `${branchName}...${upstream}`,
        ])
      )
        .trim()
        .split(/\s+/);

      return {
        ahead: Number.parseInt(counts[0] ?? "0", 10) || 0,
        behind: Number.parseInt(counts[1] ?? "0", 10) || 0,
      };
    } catch {
      return { ahead: 0, behind: 0 };
    }
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
      authorName: commit.author_name,
      authorEmail: commit.author_email,
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
    const diff = await this.git.diff(options);

    // For untracked files, `git diff` returns nothing because the file isn't
    // known to git yet. Detect that case and synthesize a unified diff against
    // /dev/null so the viewer can show the new file's contents.
    if (!diff && !staged && (await this.isUntracked(filepath))) {
      return await this.buildUntrackedDiff(filepath);
    }

    return diff;
  }

  /**
   * Check if a file is untracked (exists on disk but not known to git)
   * @private
   */
  private async isUntracked(filepath: string): Promise<boolean> {
    try {
      const result = await this.git.raw([
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        filepath,
      ]);
      return result.trim().length > 0;
    } catch (error) {
      logger.error(
        `Failed to check untracked status for "${filepath}":`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }

  /**
   * Synthesize a unified diff for an untracked file by reading it from disk
   * and treating it as fully added against /dev/null.
   * @private
   */
  private async buildUntrackedDiff(filepath: string): Promise<string> {
    const absolute = path.join(this.repoPath, filepath);
    const header =
      `diff --git a/${filepath} b/${filepath}\n` +
      `new file mode 100644\n` +
      `--- /dev/null\n` +
      `+++ b/${filepath}\n`;

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(absolute);
    } catch (error) {
      logger.error(
        `Failed to read untracked file "${filepath}":`,
        error instanceof Error ? error.message : error,
      );
      return "";
    }

    // Match git: a NUL byte in the first 8KB classifies the file as binary.
    const sniff = buffer.subarray(0, Math.min(buffer.length, 8192));
    if (sniff.includes(0)) {
      return header + `Binary files /dev/null and b/${filepath} differ\n`;
    }

    // Cap rendered content so an accidentally-untracked huge file doesn't
    // blow up memory or the viewer.
    const MAX_BYTES = 1024 * 1024;
    const truncated = buffer.length > MAX_BYTES;
    const content = (
      truncated ? buffer.subarray(0, MAX_BYTES) : buffer
    ).toString("utf8");

    if (content.length === 0) {
      return header + `@@ -0,0 +0,0 @@\n`;
    }

    const lines = content.split("\n");
    // If the file ends with a newline, split() yields a trailing empty entry —
    // drop it so we don't emit a phantom "+" line.
    const hasTrailingNewline = !truncated && content.endsWith("\n");
    if (hasTrailingNewline) lines.pop();

    const body = lines.map((line) => `+${line}`).join("\n");
    const trailer = truncated
      ? `\n+\n+[... file truncated, showing first ${MAX_BYTES} bytes of ${buffer.length} ...]\n`
      : hasTrailingNewline
        ? "\n"
        : "\n\\ No newline at end of file\n";
    return header + `@@ -0,0 +1,${lines.length} @@\n` + body + trailer;
  }

  /**
   * Get the diff for a specific file against a branch
   * @param filepath - Path to the file
   * @param branch - Branch to compare against (e.g., "main", "origin/main")
   * @returns Promise<string> - Diff output
   */
  async getDiffAgainstBranch(
    filepath: string,
    branch: string,
  ): Promise<string> {
    try {
      const branchSummary = await this.git.branch();
      const branchExists = Object.prototype.hasOwnProperty.call(
        branchSummary.branches,
        branch,
      );

      if (!branchExists) {
        const message = `Branch "${branch}" does not exist in repository "${this.repoPath}".`;
        logger.error(message);
        throw new Error(message);
      }

      return await this.git.diff([branch, "--", filepath]);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to get diff for "${filepath}" against branch "${branch}": ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get list of files changed compared to a branch
   * @param branch - Branch to compare against (e.g., "main", "master")
   * @returns Promise<GitFileStatus[]> - Array of changed files with status
   */
  async getFilesChangedAgainstBranch(branch: string): Promise<GitFileStatus[]> {
    try {
      // First verify the branch exists
      const branchSummary = await this.git.branch();
      const branchExists = Object.prototype.hasOwnProperty.call(
        branchSummary.branches,
        branch,
      );

      if (!branchExists) {
        const message = `Branch "${branch}" does not exist in repository "${this.repoPath}".`;
        logger.error(message);
        throw new Error(message);
      }

      // Get the diff with name-status to see which files changed
      const diffOutput = await this.git.diff([branch, "--name-status"]);

      if (!diffOutput.trim()) {
        // No changes
        return [];
      }

      const files: GitFileStatus[] = [];
      const lines = diffOutput.trim().split("\n");

      for (const line of lines) {
        // Format: "M\tpath/to/file" or "A\tpath/to/file" etc.
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const statusCode = parts[0].trim();
          const filepath = parts[1].trim();

          // Map git status codes to our status codes
          let mappedStatus = statusCode;
          if (statusCode.startsWith("R")) {
            // Renamed files show as "R100" or similar
            mappedStatus = GitStatus.RENAMED;
          } else if (statusCode.startsWith("C")) {
            // Copied files
            mappedStatus = GitStatus.COPIED;
          }

          // Create file status with staged=false. In branch comparison mode, this flag does not
          // reflect working tree/index state; it only indicates these are changes relative to
          // the target branch, not actual staged changes in the local repository.
          files.push(this.createFileStatus(filepath, false, mappedStatus));
        }
      }

      return files;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          `Failed to get files changed against branch "${branch}": ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get the default branch name (tries "main" first, falls back to "master")
   * @returns Promise<string> - The default branch name
   */
  async getDefaultBranch(): Promise<string> {
    try {
      const branchSummary = await this.git.branch();

      // Check if "main" exists
      if (
        Object.prototype.hasOwnProperty.call(branchSummary.branches, "main")
      ) {
        return "main";
      }

      // Check if "master" exists
      if (
        Object.prototype.hasOwnProperty.call(branchSummary.branches, "master")
      ) {
        return "master";
      }

      // If neither exists, default to "main"
      logger.warn(
        "Neither 'main' nor 'master' branch found, defaulting to 'main'",
      );
      return "main";
    } catch (error) {
      logger.error("Failed to detect default branch, defaulting to 'main'");
      return "main";
    }
  }

  /**
   * Pull from remote
   * @returns Promise<void>
   */
  async pull(): Promise<void> {
    await this.git.pull();
  }

  /**
   * Fetch from remote
   * @returns Promise<void>
   */
  async fetch(): Promise<void> {
    await this.git.fetch(["--prune"]);
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
      if (
        error instanceof Error &&
        error.message.includes("no upstream branch")
      ) {
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
   * Force push to remote using Git's lease guard.
   * @returns Promise<void>
   */
  async forcePush(): Promise<void> {
    await this.git.push(["--force-with-lease"]);
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
  async createBranch(
    branchName: string,
    source?: string | null,
  ): Promise<void> {
    if (source) {
      await this.git.checkout(["-b", branchName, source]);
      return;
    }
    await this.git.checkoutLocalBranch(branchName);
  }

  /**
   * Rename a local branch
   * @param oldName - Current branch name
   * @param newName - New branch name
   */
  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.git.branch(["-m", oldName, newName]);
  }

  /**
   * Delete a local branch
   * @param branchName - Name of the branch to delete
   * @param force - Force delete even if not fully merged (default: false)
   */
  async deleteBranch(
    branchName: string,
    force: boolean = false,
  ): Promise<void> {
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
   * Get the configured remote URL.
   * @param remote - Remote name to inspect (defaults to "origin")
   * @returns Promise<string | null> - Remote URL, or null when the remote is missing
   */
  async getRemoteUrl(remote: string = "origin"): Promise<string | null> {
    try {
      const result = await this.git.raw(["remote", "get-url", remote]);
      return result.trim() || null;
    } catch {
      return null;
    }
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
   * Push a specific tag to remote repository
   * @param tagName - Name of the tag to push
   * @param remote - Name of the remote to push to (defaults to "origin")
   */
  async pushTag(tagName: string, remote: string = "origin"): Promise<void> {
    await this.git.push([remote, tagName]);
  }

  /**
   * Get the current commit hash (short format)
   * @returns Promise<string> - Short commit hash
   * @throws Error if the repository has no commits
   */
  async getCurrentCommitHash(): Promise<string> {
    const log = await this.git.log({ maxCount: 1 });
    if (!log.latest) {
      throw new Error("No commits found in the repository.");
    }
    return log.latest.hash.substring(0, 7);
  }

  /**
   * Validate that a file path is within the repository bounds
   * @param filepath - Path to validate
   * @returns Validated absolute path
   * @throws Error if path escapes repository
   */
  private validateFilePath(filepath: string): string {
    // Resolve the full path
    const fullPath = path.resolve(this.repoPath, filepath);
    const normalizedRepoPath = path.resolve(this.repoPath);

    // Ensure the resolved path is within the repository using a relative-path check.
    // If the relative path starts with ".." or is absolute, it escapes the repository.
    const relativePath = path.relative(normalizedRepoPath, fullPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(`Path traversal detected: ${filepath}`);
    }

    return fullPath;
  }

  /**
   * List immediate children of a directory in the repo, respecting .gitignore.
   * Uses `git ls-files --cached --others --exclude-standard` so tracked +
   * untracked-not-ignored files are included; ignored files (e.g. node_modules)
   * are skipped. Directories are inferred from path prefixes at this level.
   *
   * @param dirpath - Directory relative to repo root. Empty/undefined = root.
   * @returns Sorted entries, directories first.
   */
  async listTree(
    dirpath?: string | null,
  ): Promise<Array<{ path: string; name: string; type: "FILE" | "DIR" }>> {
    const rel = (dirpath ?? "").replace(/^\/+|\/+$/g, "");
    if (rel) this.validateFilePath(rel);

    const args = [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
    ];
    if (rel) args.push("--", rel);
    const raw = await this.git.raw(args);
    const all = raw.split("\0").filter(Boolean);

    const prefix = rel ? `${rel}/` : "";
    const files = new Set<string>();
    const dirs = new Set<string>();
    for (const p of all) {
      if (rel && !p.startsWith(prefix)) continue;
      const tail = p.slice(prefix.length);
      const slash = tail.indexOf("/");
      if (slash === -1) {
        files.add(tail);
      } else {
        dirs.add(tail.slice(0, slash));
      }
    }

    const entries = [
      ...Array.from(dirs)
        .sort()
        .map((name) => ({
          name,
          path: prefix + name,
          type: "DIR" as const,
        })),
      ...Array.from(files)
        .sort()
        .map((name) => ({
          name,
          path: prefix + name,
          type: "FILE" as const,
        })),
    ];
    return entries;
  }

  /**
   * Read a file from the repository with metadata
   * @param filepath - Path to the file relative to the repository root
   * @returns Promise with content and modification time
   */
  async readFileWithMetadata(
    filepath: string,
  ): Promise<{ content: string; mtime: Date }> {
    const fullPath = this.validateFilePath(filepath);
    try {
      const [content, stats] = await Promise.all([
        fs.readFile(fullPath, "utf-8"),
        fs.stat(fullPath),
      ]);
      return { content, mtime: stats.mtime };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to read file at "${fullPath}": ${message}`);
      throw new Error(`Unable to read file: ${filepath}`);
    }
  }

  /**
   * Write content to a file in the repository with safety check
   * @param filepath - Path to the file relative to the repository root
   * @param content - Content to write to the file
   * @param expectedMtime - Expected modification time (optional)
   * @returns Promise<boolean> - True if written, false if file was modified
   */
  async writeFileWithCheck(
    filepath: string,
    content: string,
    expectedMtime?: Date,
  ): Promise<{ success: boolean; message?: string }> {
    const fullPath = this.validateFilePath(filepath);

    // If we have an expected mtime, check if the file has been modified
    if (expectedMtime) {
      try {
        const stats = await fs.stat(fullPath);
        if (stats.mtime.getTime() !== expectedMtime.getTime()) {
          return {
            success: false,
            message: "File has been modified since you started editing",
          };
        }
      } catch (error) {
        // File might have been deleted
        return {
          success: false,
          message: "File no longer exists or cannot be accessed",
        };
      }
    }

    try {
      await fs.writeFile(fullPath, content, "utf-8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to write file at "${fullPath}": ${message}`);
      return {
        success: false,
        message: `Unable to write file: ${filepath}`,
      };
    }

    return { success: true };
  }
}
