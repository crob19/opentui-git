import { createResource, createEffect, createSignal, type Accessor, type Resource } from "solid-js";
import type { GitService } from "../git-service.js";
import type { GitFileStatus } from "../types.js";

/**
 * Result object returned by useGitDiff hook
 */
export interface UseGitDiffResult {
  /** Diff content resource (reactive) */
  diffContent: Resource<string | null>;
  /** Function to manually refetch diff content */
  refetchDiff: () => Promise<string | null | undefined>;
  /** Whether diff is currently loading */
  isLoading: Accessor<boolean>;
}

/**
 * Custom hook for managing git diff loading with intelligent caching
 * Tracks the selected file and only refetches when path or staged state changes
 * @param gitService - GitService instance for git operations
 * @param selectedFile - Accessor returning the currently selected file
 * @returns Object containing diff content resource and loading state
 */
export function useGitDiff(
  gitService: GitService,
  selectedFile: Accessor<GitFileStatus | null>,
): UseGitDiffResult {
  // Track the current diff source with proper reactivity
  const [lastDiffSource, setLastDiffSource] = createSignal<{ path: string; staged: boolean } | null>(null);

  // Load diff for selected file
  const [diffContent, { refetch: refetchDiff }] = createResource(
    () => selectedFile()?.path,
    async (filePath) => {
      if (!filePath) return null;
      try {
        const file = selectedFile();
        const staged = file?.staged || false;
        console.log(`Loading diff for: ${filePath} (staged: ${staged})`);
        const diff = await gitService.getDiff(filePath, staged);
        return diff || null;
      } catch (error) {
        console.error("Error loading diff:", error);
        return null;
      }
    },
  );

  // Refetch diff when selected file changes (path or staged state)
  createEffect(() => {
    const file = selectedFile();
    if (file) {
      const currentSource = lastDiffSource();
      // Only refetch if the path or staged state actually changed
      if (!currentSource || currentSource.path !== file.path || currentSource.staged !== file.staged) {
        // Update tracking before triggering refetch to prevent race conditions
        setLastDiffSource({ path: file.path, staged: file.staged });
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
    refetchDiff: refetchDiff as () => Promise<string | null | undefined>,
    isLoading,
  };
}
