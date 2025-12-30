import { createSignal, createResource, createMemo, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitClient } from "@opentui-git/sdk";
import type { GitStatusSummary, GitFileStatus, FileTreeNode, DiffMode } from "../../git/types.js";
import { STATUS_COLORS } from "../../git/types.js";
import { buildFileTree, flattenTree, toggleFolder, preserveExpansionState } from "../utils/file-tree.js";

/**
 * Result object returned by useGitStatus hook
 */
export interface UseGitStatusResult {
  /** Git status resource (reactive) */
  gitStatus: Resource<GitStatusSummary>;
  /** Function to manually refetch git status */
  refetch: () => Promise<GitStatusSummary | undefined>;
  /** Currently selected file index */
  selectedIndex: Accessor<number>;
  /** Function to set selected file index */
  setSelectedIndex: Setter<number>;
  /** Currently selected file (computed from status and index) */
  selectedFile: Accessor<GitFileStatus | null>;
  /** Whether current directory is a git repository */
  isGitRepo: Accessor<boolean>;
  /** Current error message if any */
  errorMessage: Accessor<string | null>;
  /** Function to set error message */
  setErrorMessage: Setter<string | null>;
  /** Tree nodes for file tree display */
  treeNodes: Accessor<FileTreeNode[]>;
  /** Set tree nodes */
  setTreeNodes: Setter<FileTreeNode[]>;
  /** Flattened tree nodes (respecting collapsed state) */
  flatNodes: Accessor<FileTreeNode[]>;
  /** Currently selected tree node */
  selectedNode: Accessor<FileTreeNode | null>;
  /** Toggle folder expand/collapse */
  toggleFolderExpand: (path: string) => void;
}

/**
 * Custom hook for managing git status state and loading
 * Handles repository detection, status loading, file selection, and error state
 * @param client - SDK client for API operations
 * @param diffMode - Current diff mode (unstaged, staged, or branch)
 * @param compareBranch - Branch to compare against when in branch mode
 * @returns Object containing git status resource, selection state, and error state
 */
export function useGitStatus(
  client: GitClient,
  diffMode: Accessor<DiffMode>,
  compareBranch: Accessor<string | null>,
): UseGitStatusResult {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isGitRepo, setIsGitRepo] = createSignal(true);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [treeNodes, setTreeNodes] = createSignal<FileTreeNode[]>([]);

  // Load git status - make it reactive to diffMode and compareBranch
  const [gitStatus, { refetch }] = createResource<GitStatusSummary, { mode: DiffMode; branch: string | null }>(
    () => ({ mode: diffMode(), branch: compareBranch() }),
    async (source) => {
      try {
        // Check if we're in a git repo
        const repoInfo = await client.getRepoInfo();
        setIsGitRepo(repoInfo.isRepo);

        if (!repoInfo.isRepo) {
          setErrorMessage("Not a git repository");
          // Return empty status instead of throwing
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

        // Fetch files based on diff mode
        if (source.mode === "branch" && source.branch) {
          // Get files changed compared to branch
          files = await client.getFilesChangedAgainstBranch(source.branch);
          
          // Also get actual working directory status to mark files with local changes
          const workingDirStatus = await client.getStatus();
          const workingDirPaths = new Set(workingDirStatus.files.map((f: GitFileStatus) => f.path));
          
          // Mark files that have local changes
          files = files.map((file: GitFileStatus) => ({
            ...file,
            hasLocalChanges: workingDirPaths.has(file.path),
            // Update color for files without local changes
            color: workingDirPaths.has(file.path) ? file.color : STATUS_COLORS.BRANCH_ONLY,
          }));
          

          // Get current branch info for the status summary
          const branches = await client.getBranches();
          status = {
            current: branches.current,
            ahead: 0,
            behind: 0,
            files,
            isClean: files.length === 0,
          };
        } else if (source.mode === "branch" && !source.branch) {
          // Branch mode but branch not yet loaded - return empty state
          const branches = await client.getBranches();
          files = [];
          status = {
            current: branches.current,
            ahead: 0,
            behind: 0,
            files: [],
            isClean: true,
          };
        } else {
          // Normal git status (unstaged or staged)
          status = await client.getStatus();
          files = status.files;
        }

        setErrorMessage(null);

        // Build tree from files, preserving user's expansion state
        const oldTree = treeNodes();
        const newTree = buildFileTree(files);
        const mergedTree = preserveExpansionState(oldTree, newTree);
        setTreeNodes(mergedTree);

        // Get flattened nodes for index-based navigation
        const flat = flattenTree(mergedTree);

        // Reset selected index if nodes list changed
        if (selectedIndex() >= flat.length) {
          setSelectedIndex(Math.max(0, flat.length - 1));
        }

        return status;
      } catch (error) {
        console.error("Error loading git status:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown error",
        );
        setIsGitRepo(false);
        // Return empty status instead of throwing to prevent resource error state
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

  // Flatten tree for rendering and navigation
  const flatNodes = createMemo(() => flattenTree(treeNodes()));

  // Get selected file (from selected node)
  const selectedFile = () => {
    const node = selectedNode();
    if (!node) return null;
    
    // If it's a file node, return its file status
    if (node.type === 'file' && node.fileStatus) {
      return node.fileStatus;
    }
    
    // If it's a folder, don't return a file (no diff to show)
    return null;
  };

  // Get selected node (can be file or folder)
  const selectedNode = () => {
    const nodes = flatNodes();
    if (nodes.length === 0) return null;
    return nodes[selectedIndex()] || null;
  };

  // Toggle folder expand/collapse
  const toggleFolderExpand = (path: string) => {
    const updatedTree = toggleFolder(treeNodes(), path);
    setTreeNodes(updatedTree);
    // After toggling, ensure selected index is still valid
    const newFlat = flattenTree(updatedTree);
    if (selectedIndex() >= newFlat.length) {
      setSelectedIndex(Math.max(0, newFlat.length - 1));
    }
  };

  return {
    gitStatus,
    refetch: refetch as () => Promise<GitStatusSummary | undefined>,
    selectedIndex,
    setSelectedIndex,
    selectedFile,
    isGitRepo,
    errorMessage,
    setErrorMessage,
    treeNodes,
    setTreeNodes,
    flatNodes,
    selectedNode,
    toggleFolderExpand,
  };
}
