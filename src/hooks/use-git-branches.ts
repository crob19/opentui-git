import { createSignal, createResource, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitService } from "../git-service.js";
import type { GitBranchInfo } from "../types.js";

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
 * @param gitService - GitService instance for git operations
 * @returns Object containing branch resource, local branches list, and selection state
 */
export function useGitBranches(gitService: GitService): UseGitBranchesResult {
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  // Load branches
  const [branches, { refetch: refetchBranches }] =
    createResource<GitBranchInfo>(async () => {
      try {
        return await gitService.getBranches();
      } catch (error) {
        console.error("Error loading branches:", error);
        throw error;
      }
    });

  // Get local branches only (filter out remotes)
  const localBranches = () => {
    const b = branches();
    if (!b) return [];
    return b.all
      .filter((name) => !name.startsWith("remotes/"))
      .sort((a, bName) => {
        // Put current branch first
        if (a === b.current) return -1;
        if (bName === b.current) return 1;
        return a.localeCompare(bName);
      });
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
