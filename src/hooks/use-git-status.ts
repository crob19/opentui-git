import { createSignal, createResource, createMemo, type Accessor, type Setter, type Resource } from "solid-js";
import type { GitService } from "../git-service.js";
import type { GitStatusSummary, GitFileStatus, FileTreeNode } from "../types.js";
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
 * @param gitService - GitService instance for git operations
 * @returns Object containing git status resource, selection state, and error state
 */
export function useGitStatus(gitService: GitService): UseGitStatusResult {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isGitRepo, setIsGitRepo] = createSignal(true);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [treeNodes, setTreeNodes] = createSignal<FileTreeNode[]>([]);

  // Load git status
  const [gitStatus, { refetch }] = createResource<GitStatusSummary>(
    async () => {
      try {
        // Check if we're in a git repo
        const inRepo = await gitService.isRepo();
        setIsGitRepo(inRepo);

        if (!inRepo) {
          setErrorMessage("Not a git repository");
          throw new Error("Not a git repository");
        }

        const status = await gitService.getStatus();
        setErrorMessage(null);

        // Build tree from files, preserving user's expansion state
        const oldTree = treeNodes();
        const newTree = buildFileTree(status.files);
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
        throw error;
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
    setTreeNodes(toggleFolder(treeNodes(), path));
    // After toggling, ensure selected index is still valid
    const newFlat = flattenTree(toggleFolder(treeNodes(), path));
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
