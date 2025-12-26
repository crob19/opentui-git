import { useKeyboard } from "@opentui/solid";
import type { GitService } from "../git-service.js";
import type { ToastContext } from "../components/toast.js";
import type { DialogContext } from "../components/dialog.js";
import type { PanelType } from "../commands/types.js";
import type { UseGitStatusResult } from "./use-git-status.js";
import type { UseGitBranchesResult } from "./use-git-branches.js";
import type { UseGitTagsResult } from "./use-git-tags.js";
import type { Accessor, Setter } from "solid-js";
import type { BranchPanelTab } from "../app.js";
import * as fileCommands from "../commands/file-commands.js";
import * as branchCommands from "../commands/branch-commands.js";
import * as remoteCommands from "../commands/remote-commands.js";
import * as navCommands from "../commands/navigation-commands.js";
import * as tagCommands from "../commands/tag-commands.js";
import { getFilesInFolder } from "../utils/file-tree.js";

/**
 * Options for the command handler hook
 */
export interface UseCommandHandlerOptions {
  /** Git service instance */
  gitService: GitService;
  /** Toast context for notifications */
  toast: ToastContext;
  /** Dialog context for modals */
  dialog: DialogContext;
  /** Active panel accessor */
  activePanel: Accessor<PanelType>;
  /** Active panel setter */
  setActivePanel: Setter<PanelType>;
  /** Git status hook result */
  gitStatus: UseGitStatusResult;
  /** Git branches hook result */
  gitBranches: UseGitBranchesResult;
  /** Git tags hook result */
  gitTags: UseGitTagsResult;
  /** Branch panel tab accessor (branches/tags) */
  branchPanelTab: Accessor<BranchPanelTab>;
  /** Branch panel tab setter */
  setBranchPanelTab: Setter<BranchPanelTab>;
  /** Renderer result from OpenTUI */
  renderer: ReturnType<typeof import("@opentui/solid").useRenderer>;
  /** Selected diff row index */
  selectedDiffRow: Accessor<number>;
  /** Selected diff row setter */
  setSelectedDiffRow: Setter<number>;
  /** Diff view mode (unified or side-by-side) */
  diffViewMode: Accessor<"unified" | "side-by-side">;
  /** Diff view mode setter */
  setDiffViewMode: Setter<"unified" | "side-by-side">;
}

/**
 * Custom hook for handling keyboard commands and dispatching to appropriate handlers
 * Sets up keyboard listener and routes commands based on active panel and key combinations
 * @param options - Command handler options
 */
export function useCommandHandler(options: UseCommandHandlerOptions): void {
  const {
    gitService,
    toast,
    dialog,
    activePanel,
    setActivePanel,
    gitStatus,
    gitBranches,
    gitTags,
    branchPanelTab,
    setBranchPanelTab,
    renderer,
    selectedDiffRow,
    setSelectedDiffRow,
    diffViewMode,
    setDiffViewMode,
  } = options;

  /**
   * Main keyboard handler - routes commands based on context
   */
  const handleKeyPress = async (key: string, ctrl: boolean, shift: boolean) => {
    // Skip all key handling when dialog is open (let dialog handle its own keys)
    if (dialog.isOpen) {
      return;
    }

    console.log(`Key pressed: "${key}", ctrl: ${ctrl}, shift: ${shift}`);

    // Handle console/debug toggles (work regardless of git status)
    if (ctrl) {
      switch (key) {
        case "\\":
          // Toggle console overlay (Ctrl+\)
          renderer.console.toggle();
          return;
        case "d":
          // Toggle debug overlay (Ctrl+D)
          renderer.toggleDebugOverlay();
          return;
        case "c":
          // Ctrl+C quits
          process.exit(0);
          return;
      }
    }

    const status = gitStatus.gitStatus();
    const branchList = gitBranches.localBranches();
    const currentBranch = gitBranches.currentBranch();

    // Handle quit regardless of status
    if (key === "q" && !ctrl) {
      process.exit(0);
    }

    // Handle pull/push regardless of file status
    // Special case: Shift+P on tags tab pushes the selected tag
    if (key === "p" || key === "P") {
      // If in branches panel on tags tab with Shift, push the selected tag
      if (shift && activePanel() === "branches" && branchPanelTab() === "tags") {
        const selectedTag = gitTags.selectedTag();
        if (selectedTag) {
          await tagCommands.pushTag(selectedTag, {
            gitService,
            toast,
            dialog,
            setErrorMessage: gitStatus.setErrorMessage,
            refetch: gitStatus.refetch,
            refetchTags: gitTags.refetchTags,
          });
        } else {
          toast.info("No tag selected");
        }
        return;
      }

      // Default push/pull behavior
      const context = {
        gitService,
        toast,
        dialog,
        setErrorMessage: gitStatus.setErrorMessage,
        refetch: gitStatus.refetch,
      };

      if (shift) {
        await remoteCommands.push(context);
      } else {
        await remoteCommands.pull(context);
      }
      return;
    }

    // Toggle between panels with Tab
    if (key === "tab") {
      navCommands.switchPanel(activePanel, setActivePanel);
      return;
    }

    try {
      // Panel-specific key handling
      if (activePanel() === "branches") {
        await handleBranchPanelKeys(key, shift, {
          branchList,
          currentBranch,
          gitBranches,
          gitTags,
          branchPanelTab,
          setBranchPanelTab,
          gitService,
          toast,
          dialog,
          setErrorMessage: gitStatus.setErrorMessage,
          refetch: gitStatus.refetch,
          refetchBranches: gitBranches.refetchBranches,
          refetchTags: gitTags.refetchTags,
        });
      } else if (activePanel() === "diff") {
        // Diff panel keys
        await handleDiffPanelKeys(key, ctrl, {
          setActivePanel,
          selectedDiffRow,
          setSelectedDiffRow,
          diffViewMode,
          setDiffViewMode,
        });
      } else {
        // Files panel keys
        await handleFilePanelKeys(key, {
          status,
          currentBranch,
          gitStatus,
          gitService,
          toast,
          dialog,
          setErrorMessage: gitStatus.setErrorMessage,
          refetch: gitStatus.refetch,
          refetchTags: gitTags.refetchTags,
          setActivePanel,
        });
      }
    } catch (error) {
      console.error("Error handling key press:", error);
      gitStatus.setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Set up keyboard listener using OpenTUI hook
  useKeyboard((event) => {
    console.log("Raw event:", JSON.stringify(event));
    const key = event.name || event.sequence;
    const ctrl = event.ctrl || false;
    const shift = event.shift || false;
    handleKeyPress(key, ctrl, shift);
  });
}

/**
 * Handle keyboard commands specific to the branches panel
 */
async function handleBranchPanelKeys(
  key: string,
  shift: boolean,
  context: {
    branchList: string[];
    currentBranch: string;
    gitBranches: UseGitBranchesResult;
    gitTags: UseGitTagsResult;
    branchPanelTab: Accessor<BranchPanelTab>;
    setBranchPanelTab: Setter<BranchPanelTab>;
    gitService: GitService;
    toast: ToastContext;
    dialog: DialogContext;
    setErrorMessage: (msg: string | null) => void;
    refetch: () => Promise<unknown>;
    refetchBranches: () => Promise<unknown>;
    refetchTags: () => Promise<unknown>;
  },
): Promise<void> {
  const { branchList, currentBranch, gitBranches, gitTags, branchPanelTab, setBranchPanelTab } = context;

  // Get the current list and selection based on active tab
  const currentList = branchPanelTab() === "branches" ? branchList : gitTags.allTags();
  const currentSelectedIndex = branchPanelTab() === "branches" ? gitBranches.selectedIndex : gitTags.selectedIndex;
  const currentSetSelectedIndex = branchPanelTab() === "branches" ? gitBranches.setSelectedIndex : gitTags.setSelectedIndex;

  switch (key) {
    // Tab navigation with [ and ]
    case "[":
      // Reset selection when switching to branches tab
      gitBranches.setSelectedIndex(0);
      setBranchPanelTab("branches");
      break;
    
    case "]":
      // Reset selection when switching to tags tab
      gitTags.setSelectedIndex(0);
      setBranchPanelTab("tags");
      break;

    case "j":
    case "down":
      navCommands.navigateDown(
        currentSelectedIndex,
        currentSetSelectedIndex,
        currentList.length - 1,
      );
      break;

    case "k":
    case "up":
      navCommands.navigateUp(
        currentSelectedIndex,
        currentSetSelectedIndex,
      );
      break;

    // Checkout branch with space (only on branches tab)
    case " ":
    case "space": {
      if (branchPanelTab() === "branches") {
        const branch = gitBranches.selectedBranch();
        if (branch && branch !== currentBranch) {
          await branchCommands.checkoutBranch(branch, context);
        } else if (branch === currentBranch) {
          context.toast.info("Already on this branch");
        }
      }
      break;
    }

    // Delete branch with 'd' (only on branches tab)
    case "d": {
      if (branchPanelTab() === "branches") {
        const branchToDelete = gitBranches.selectedBranch();
        if (!branchToDelete) break;

        branchCommands.showDeleteBranchDialog(branchToDelete, currentBranch, {
          ...context,
          setBranchSelectedIndex: gitBranches.setSelectedIndex,
        });
      }
      break;
    }

    // New branch
    case "n":
      branchCommands.showNewBranchDialog(currentBranch, true, {
        ...context,
        setBranchSelectedIndex: gitBranches.setSelectedIndex,
      });
      break;

    // Create tag
    case "t": {
      const commitHash = await context.gitService.getCurrentCommitHash();
      await tagCommands.showTagDialog(currentBranch, commitHash, context);
      break;
    }

    // Merge branch with 'M' (Shift+m, only on branches tab)
    case "m": {
      if (!shift) break; // Only trigger on Shift+m
      if (branchPanelTab() === "branches") {
        const branchToMerge = gitBranches.selectedBranch();
        if (!branchToMerge) break;

        branchCommands.showMergeBranchDialog(
          branchToMerge,
          currentBranch,
          context,
        );
      }
      break;
    }
  }
}

/**
 * Handle keyboard commands specific to the diff panel
 */
async function handleDiffPanelKeys(
  key: string,
  ctrl: boolean,
  context: {
    setActivePanel: Setter<PanelType>;
    selectedDiffRow: Accessor<number>;
    setSelectedDiffRow: Setter<number>;
    diffViewMode: Accessor<"unified" | "side-by-side">;
    setDiffViewMode: Setter<"unified" | "side-by-side">;
  },
): Promise<void> {
  // Toggle view mode with Ctrl+T
  if (ctrl && key === "t") {
    const current = context.diffViewMode();
    context.setDiffViewMode(current === "unified" ? "side-by-side" : "unified");
    return;
  }

  // We use a large max value - virtual scrolling will handle bounds
  const maxRow = 10000;

  switch (key) {
    case "j":
    case "down":
      navCommands.navigateDown(
        context.selectedDiffRow,
        context.setSelectedDiffRow,
        maxRow,
      );
      break;

    case "k":
    case "up":
      navCommands.navigateUp(
        context.selectedDiffRow,
        context.setSelectedDiffRow,
      );
      break;

    case "escape":
      // Return to files panel and reset diff scroll position
      context.setSelectedDiffRow(0);
      context.setActivePanel("files");
      break;
  }
}

/**
 * Handle keyboard commands specific to the files panel
 */
async function handleFilePanelKeys(
  key: string,
  context: {
    status: ReturnType<UseGitStatusResult["gitStatus"]>;
    currentBranch: string;
    gitStatus: UseGitStatusResult;
    gitService: GitService;
    toast: ToastContext;
    dialog: DialogContext;
    setErrorMessage: (msg: string | null) => void;
    refetch: () => Promise<unknown>;
    refetchTags: () => Promise<unknown>;
    setActivePanel: Setter<PanelType>;
  },
): Promise<void> {
  const { status, currentBranch, gitStatus } = context;

  // Allow 'n' (new branch) even without files
  if (key === "n") {
    branchCommands.showNewBranchDialog(currentBranch, false, {
      ...context,
      refetchBranches: async () => {}, // Not needed in file panel context
    });
    return;
  }

  // Allow 't' (create tag) even without files
  if (key === "t") {
    try {
      const commitHash = await context.gitService.getCurrentCommitHash();
      await tagCommands.showTagDialog(currentBranch, commitHash, context);
    } catch (error) {
      // Handle case where there is no current commit (for example, empty repository)
      console.error("Failed to get current commit hash for tag creation:", error);
      context.setErrorMessage(
        "Cannot create a tag because the repository has no commits yet.",
      );
    }
    return;
  }

  // Get flat nodes for navigation
  const flatNodes = gitStatus.flatNodes();
  
  // Other commands require nodes
  if (flatNodes.length === 0) return;

  switch (key) {
    // Navigation
    case "j":
    case "down":
      navCommands.navigateDown(
        gitStatus.selectedIndex,
        gitStatus.setSelectedIndex,
        flatNodes.length - 1,
      );
      break;

    case "k":
    case "up":
      navCommands.navigateUp(
        gitStatus.selectedIndex,
        gitStatus.setSelectedIndex,
      );
      break;

    // Enter: Toggle folder expand/collapse or view diff for file
    case "return":
    case "enter": {
      const node = gitStatus.selectedNode();
      if (node && node.type === 'folder') {
        gitStatus.toggleFolderExpand(node.path);
      } else if (node && node.type === 'file') {
        // Switch to diff panel when Enter is pressed on a file
        context.setActivePanel("diff");
      }
      break;
    }

    // Stage/unstage current file or folder
    case " ":
    case "space": {
      const node = gitStatus.selectedNode();
      if (!node) break;

      if (node.type === 'folder') {
        // Get all files in the folder recursively
        const filesInFolder = getFilesInFolder(node);
        
        // Check if any files in folder (including nested files) are unstaged
        const hasUnstaged = status?.files.some((file) => {
          return filesInFolder.includes(file.path) && !file.staged;
        }) || false;

        if (hasUnstaged) {
          await fileCommands.stageFolder(node, context);
        } else {
          await fileCommands.unstageFolder(node, context);
        }
      } else if (node.type === 'file' && node.fileStatus) {
        // Stage/unstage individual file
        if (node.fileStatus.staged) {
          await fileCommands.unstageFile(node.fileStatus.path, context);
        } else {
          await fileCommands.stageFile(node.fileStatus.path, context);
        }
      }
      break;
    }

    // Stage all
    case "a":
      await fileCommands.stageAll(context);
      break;

    // Unstage all
    case "u":
      await fileCommands.unstageAll(context);
      break;

    // Commit
    case "c": {
      const stagedFiles = status?.files.filter((f) => f.staged) || [];
      fileCommands.showCommitDialog(stagedFiles.length, context);
      break;
    }
  }
}
