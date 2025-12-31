import { createSignal, createResource, createMemo, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitClient } from "@opentui-git/sdk";
import type { GitStatusSummary, GitFileStatus, FileTreeNode, DiffMode } from "@opentui-git/core/git/types";
import { STATUS_COLORS } from "@opentui-git/core/git/types";
import { buildFileTree, flattenTree, toggleFolder, preserveExpansionState } from "@opentui-git/core/utils/file-tree";

/**
 * Result object returned by useGitStatus hook
 */
export interface UseGitStatusResult {
  /** Git status resource (reactive) */
  gitStatus: Resource<GitStatusSummary>;
  /** Function to manually refetch git status */
  refetch: () => Promise<GitStatusSummary | undefined>;
  /** Currently selected file path */
  selectedPath: Accessor<string | null>;
  /** Function to set selected file path */
  setSelectedPath: Setter<string | null>;
  /** Currently selected file (computed from path) */
  selectedFile: Accessor<GitFileStatus | null>;
  /** Whether current directory is a git repository */
  isGitRepo: Accessor<boolean>;
  /** Current error message if any */
  errorMessage: Accessor<string | null>;
  /** Tree nodes for file tree display */
  treeNodes: Accessor<FileTreeNode[]>;
  /** Flattened tree nodes (respecting collapsed state) */
  flatNodes: Accessor<FileTreeNode[]>;
  /** Toggle folder expand/collapse */
  toggleFolderExpand: (path: string) => void;
}

/**
 * Custom hook for managing git status state and loading
 */
export function useGitStatus(
  client: GitClient,
  diffMode: Accessor<DiffMode>,
  compareBranch: Accessor<string | null>,
): UseGitStatusResult {
  const [selectedPath, setSelectedPath] = createSignal<string | null>(null);
  const [isGitRepo, setIsGitRepo] = createSignal(true);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [treeNodes, setTreeNodes] = createSignal<FileTreeNode[]>([]);

  // Load git status
  const [gitStatus, { refetch }] = createResource<GitStatusSummary, { mode: DiffMode; branch: string | null }>(
    () => ({ mode: diffMode(), branch: compareBranch() }),
    async (source) => {
      try {
        const repoInfo = await client.getRepoInfo();
        setIsGitRepo(repoInfo.isRepo);

        if (!repoInfo.isRepo) {
          setErrorMessage("Not a git repository");
          return {
            current: "",
            ahead: 0,
            behind: 0,
            files: [],
            isClean: true,
          };
        }

        let files: GitFileStatus[];
        let status: GitStatusSummary;

        if (source.mode === "branch" && source.branch) {
          files = await client.getFilesChangedAgainstBranch(source.branch);
          const workingDirStatus = await client.getStatus();
          const workingDirPaths = new Set(workingDirStatus.files.map((f: GitFileStatus) => f.path));
          
          files = files.map((file: GitFileStatus) => ({
            ...file,
            hasLocalChanges: workingDirPaths.has(file.path),
            color: workingDirPaths.has(file.path) ? file.color : STATUS_COLORS.BRANCH_ONLY,
          }));

          const branches = await client.getBranches();
          status = {
            current: branches.current,
            ahead: 0,
            behind: 0,
            files,
            isClean: files.length === 0,
          };
        } else if (source.mode === "branch" && !source.branch) {
          const branches = await client.getBranches();
          status = {
            current: branches.current,
            ahead: 0,
            behind: 0,
            files: [],
            isClean: true,
          };
        } else {
          status = await client.getStatus();
        }

        setErrorMessage(null);

        // Build tree from files, preserving user's expansion state
        const oldTree = treeNodes();
        const newTree = buildFileTree(status.files);
        const mergedTree = preserveExpansionState(oldTree, newTree);
        setTreeNodes(mergedTree);

        return status;
      } catch (error) {
        console.error("Error loading git status:", error);
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
        setIsGitRepo(false);
        return {
          current: "",
          ahead: 0,
          behind: 0,
          files: [],
          isClean: true,
        };
      }
    },
  );

  // Flatten tree for rendering
  const flatNodes = createMemo(() => flattenTree(treeNodes()));

  // Get selected file from path - must be a memo for proper reactivity
  const selectedFile = createMemo(() => {
    const path = selectedPath();
    if (!path) return null;
    const status = gitStatus();
    if (!status) return null;
    console.log("[useGitStatus] selectedFile memo recalculated:", path, "found:", status.files.find(f => f.path === path) ? "yes" : "no");
    return status.files.find(f => f.path === path) || null;
  });

  // Toggle folder expand/collapse
  const toggleFolderExpand = (path: string) => {
    const updatedTree = toggleFolder(treeNodes(), path);
    setTreeNodes(updatedTree);
  };

  return {
    gitStatus,
    refetch: refetch as () => Promise<GitStatusSummary | undefined>,
    selectedPath,
    setSelectedPath,
    selectedFile,
    isGitRepo,
    errorMessage,
    treeNodes,
    flatNodes,
    toggleFolderExpand,
  };
}
