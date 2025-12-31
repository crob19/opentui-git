import { createResource, createMemo, type Accessor, type Resource } from "solid-js";
import type { GitClient } from "@opentui-git/sdk";
import type { GitFileStatus, DiffMode } from "@opentui-git/core/git/types";

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
 * Custom hook for managing git diff loading
 */
export function useGitDiff(
  client: GitClient,
  selectedFile: Accessor<GitFileStatus | null>,
  diffMode: Accessor<DiffMode>,
  compareBranch: Accessor<string | null>,
): UseGitDiffResult {
  // Create a reactive source that combines all the relevant values
  const diffSource = createMemo(() => {
    const file = selectedFile();
    if (!file) {
      return null;
    }
    return {
      path: file.path,
      staged: file.staged || false,
      mode: diffMode(),
      branch: compareBranch(),
    };
  });

  // Load diff for selected file - reactive to the source
  const [diffContent, { refetch: refetchDiff }] = createResource(
    diffSource,
    async (source) => {
      if (!source) return null;
      
      try {
        let diff: string;
        if (source.mode === "branch" && source.branch) {
          diff = await client.getDiff(source.path, { branch: source.branch });
        } else if (source.mode === "branch" && !source.branch) {
          // Branch mode but branch not yet loaded - return empty diff
          diff = "";
        } else {
          const staged = source.mode === "staged";
          diff = await client.getDiff(source.path, { staged });
        }

        return diff || null;
      } catch (error) {
        console.error("Error loading diff:", error);
        return null;
      }
    },
  );

  const isLoading = () => diffContent.loading;

  return {
    diffContent,
    refetch: refetchDiff as () => Promise<string | null | undefined>,
    isLoading,
  };
}
