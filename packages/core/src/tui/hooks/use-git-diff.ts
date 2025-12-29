import { createResource, createEffect, createSignal, type Accessor, type Resource } from "solid-js";
import type { GitService } from "../../git/index.js";
import type { GitFileStatus, DiffMode } from "../../git/types.js";

/**
 * Result object returned by useGitDiff hook
 */
export interface UseGitDiffResult {
  /** Diff content resource (reactive) */
  diffContent: Resource<string | null>;
  /** Function to manually refetch diff content */
  refetch: () => Promise<string | null | undefined>;
  /** Whether diff is currently loading */
  isLoading: Accessor<boolean>;
}

/**
 * Custom hook for managing git diff loading with intelligent caching
 * Tracks the selected file and only refetches when path, staged state, or diff mode changes
 * @param gitService - GitService instance for git operations
 * @param selectedFile - Accessor returning the currently selected file
 * @param diffMode - Accessor returning the current diff mode
 * @param compareBranch - Accessor returning the branch to compare against
 * @returns Object containing diff content resource and loading state
 */
export function useGitDiff(
  gitService: GitService,
  selectedFile: Accessor<GitFileStatus | null>,
  diffMode: Accessor<DiffMode>,
  compareBranch: Accessor<string | null>,
): UseGitDiffResult {
  // Track the current diff source with proper reactivity
  const [lastDiffSource, setLastDiffSource] = createSignal<{
    path: string;
    staged: boolean;
    mode: DiffMode;
    branch: string | null;
  } | null>(null);

  // Load diff for selected file
  const [diffContent, { refetch: refetchDiff }] = createResource(
    () => selectedFile()?.path,
    async (filePath) => {
      if (!filePath) return null;
      try {
        const mode = diffMode();
        const branch = compareBranch();

        console.log(`Loading diff for: ${filePath} (mode: ${mode}, branch: ${branch})`);

        let diff: string;
        if (mode === "branch" && branch) {
          diff = await gitService.getDiffAgainstBranch(filePath, branch);
        } else if (mode === "branch" && !branch) {
          // Branch mode but branch not yet loaded - return empty diff
          diff = "";
        } else {
          const staged = mode === "staged";
          diff = await gitService.getDiff(filePath, staged);
        }

        return diff || null;
      } catch (error) {
        console.error("Error loading diff:", error);
        return null;
      }
    },
  );

  // Refetch diff when selected file changes (path, staged state, mode, or branch)
  createEffect(() => {
    const file = selectedFile();
    if (file) {
      const currentSource = lastDiffSource();
      const mode = diffMode();
      const branch = compareBranch();
      const staged = file.staged || false;

      // Only refetch if any relevant parameter changed
      if (
        !currentSource ||
        currentSource.path !== file.path ||
        currentSource.staged !== staged ||
        currentSource.mode !== mode ||
        currentSource.branch !== branch
      ) {
        // Update tracking before triggering refetch to prevent race conditions
        setLastDiffSource({ path: file.path, staged, mode, branch });
        refetchDiff();
      }
    } else {
      // Clear tracking when no file is selected
      setLastDiffSource(null);
    }
  });

  const isLoading = () => diffContent.loading;

  return {
    diffContent,
    refetch: refetchDiff as () => Promise<string | null | undefined>,
    isLoading,
  };
}
