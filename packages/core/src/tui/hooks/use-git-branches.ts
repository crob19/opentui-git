import { createSignal, createResource, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitClient } from "@opentui-git/sdk";
import type { GitBranchInfo } from "../../git/types.js";
import { logger } from "../utils/logger.js";

/**
 * Result object returned by useGitBranches hook
 */
export interface UseGitBranchesResult {
  /** Branch info resource (reactive) */
  branches: Resource<GitBranchInfo>;
  /** Function to manually refetch branch information */
  refetchBranches: () => Promise<GitBranchInfo | undefined>;
  /** Local branches only (filtered, sorted with current first) */
  localBranches: Accessor<string[]>;
  /** Currently selected branch index */
  selectedIndex: Accessor<number>;
  /** Function to set selected branch index */
  setSelectedIndex: Setter<number>;
  /** Currently selected branch name */
  selectedBranch: Accessor<string | null>;
  /** Current branch name */
  currentBranch: Accessor<string>;
}

/**
 * Custom hook for managing git branch state and loading
 * Handles branch loading, filtering local branches, and branch selection
 * @param client - SDK client for API operations
 * @returns Object containing branch resource, local branches list, and selection state
 */
export function useGitBranches(client: GitClient): UseGitBranchesResult {
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  // Load branches
  const [branches, { refetch: refetchBranches }] =
    createResource<GitBranchInfo>(async () => {
      try {
        const result = await client.getBranches();
        return result;
      } catch (error) {
        logger.error("[use-git-branches] Error loading branches:", error);
        // Return empty result to prevent resource from being in error state
        return { all: [], current: "", branches: [], detached: false };
      }
    });

  // Get local branches only (filter out remotes)
  const localBranches = () => {
    const b = branches();
    // Return empty array if resource is still loading or undefined
    if (!b || !b.all) {
      return [];
    }
    const filtered = b.all
      .filter((name: string) => !name.startsWith("remotes/"))
      .sort((a: string, bName: string) => {
        // Put current branch first
        if (a === b.current) return -1;
        if (bName === b.current) return 1;
        return a.localeCompare(bName);
      });
    return filtered;
  };

  // Get selected branch name
  const selectedBranch = () => {
    const list = localBranches();
    return list[selectedIndex()] || null;
  };

  // Get current branch name
  const currentBranch = () => {
    return branches()?.current || "";
  };

  return {
    branches,
    refetchBranches: refetchBranches as () => Promise<GitBranchInfo | undefined>,
    localBranches,
    selectedIndex,
    setSelectedIndex,
    selectedBranch,
    currentBranch,
  };
}
