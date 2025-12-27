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
import { logger } from "../utils/logger.js";
import { executeShutdown } from "../index.js";
import { parseSideBySideDiff, parseDiffLines } from "../utils/diff-parser.js";

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
  /** Edit mode state */
  isEditMode: Accessor<boolean>;
  /** Edit mode setter */
  setIsEditMode: Setter<boolean>;
  /** Edited content state */
  editedContent: Accessor<string>;
  /** Edited content setter */
  setEditedContent: Setter<string>;
  /** All edited lines in current session */
  editedLines: Accessor<Map<number, string>>;
  /** Setter for edited lines */
  setEditedLines: Setter<Map<number, string>>;
  /** Full file content for edit mode */
  fileContent: Accessor<string>;
  /** Setter for file content */
  setFileContent: Setter<string>;
  /** Selected line number in full file */
  selectedLine: Accessor<number>;
  /** Setter for selected line */
  setSelectedLine: Setter<number>;
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
    isEditMode,
    setIsEditMode,
    editedContent,
    setEditedContent,
    editedLines,
    setEditedLines,
    fileContent,
    setFileContent,
    selectedLine,
    setSelectedLine,
  } = options;

  /**
   * Graceful shutdown function
   * Triggers the global shutdown sequence which executes all registered cleanup handlers
   */
  const shutdown = () => {
    logger.info("Initiating graceful shutdown...");
    // Execute the global shutdown which runs all registered cleanup handlers
    executeShutdown();
  };

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
          shutdown();
          return;
      }
    }

    const status = gitStatus.gitStatus();
    const branchList = gitBranches.localBranches();
    const currentBranch = gitBranches.currentBranch();

    // Handle quit regardless of status
    if (key === "q" && !ctrl) {
      shutdown();
      return;
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
          isEditMode,
          setIsEditMode,
          editedContent,
          setEditedContent,
          editedLines,
          setEditedLines,
          fileContent,
          setFileContent,
          selectedLine,
          setSelectedLine,
          gitService,
          gitStatus,
          toast,
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
    isEditMode: Accessor<boolean>;
    setIsEditMode: Setter<boolean>;
    editedContent: Accessor<string>;
    setEditedContent: Setter<string>;
    editedLines: Accessor<Map<number, string>>;
    setEditedLines: Setter<Map<number, string>>;
    fileContent: Accessor<string>;
    setFileContent: Setter<string>;
    selectedLine: Accessor<number>;
    setSelectedLine: Setter<number>;
    gitService: GitService;
    gitStatus: UseGitStatusResult;
    toast: ToastContext;
  },
): Promise<void> {
  // Helper function to save current edit to editedLines map before navigating
  const saveCurrentEdit = () => {
    if (!context.isEditMode()) return;

    const lines = context.fileContent().split('\n');
    const lineIndex = context.selectedLine();

    // Bounds check
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const lineNumber = lineIndex + 1; // Convert to 1-based
    const originalLine = lines[lineIndex];

    // Only save if the content actually changed
    if (context.editedContent() !== originalLine) {
      const newMap = new Map(context.editedLines());
      newMap.set(lineNumber, context.editedContent());
      context.setEditedLines(newMap);
    }
  };

  // Handle save in edit mode with Ctrl+S
  if (ctrl && key === "s" && context.isEditMode()) {
    const selectedFile = context.gitStatus.selectedFile();
    if (!selectedFile) {
      context.toast.error("No file selected");
      return;
    }

    try {
      // First, save the current line edit
      saveCurrentEdit();

      const editedLinesMap = context.editedLines();
      if (editedLinesMap.size === 0) {
        context.toast.info("No changes to save");
        context.setIsEditMode(false);
        context.setEditedLines(new Map());
        return;
      }

      // Get the original file content that was loaded
      const lines = context.fileContent().split('\n');

      // Validate and apply all edits
      for (const [lineNum, newContent] of editedLinesMap) {
        const lineIndex = lineNum - 1;
        // Bounds check
        if (lineIndex < 0 || lineIndex >= lines.length) {
          context.toast.error(`Line ${lineNum} is out of bounds. File may have changed.`);
          return;
        }
        lines[lineIndex] = newContent;
      }

      // Write back to file
      await context.gitService.writeFile(selectedFile.path, lines.join('\n'));

      const count = editedLinesMap.size;
      context.toast.success(`Saved ${count} line${count > 1 ? 's' : ''} to ${selectedFile.path}`);

      // Exit edit mode and clear all state
      context.setIsEditMode(false);
      context.setEditedLines(new Map());
      context.setEditedContent("");
      context.setFileContent("");

      // Refetch git status and diff
      await context.gitStatus.refetch();
      // Reset selected diff row to avoid pointing to an invalid or changed line
      context.setSelectedDiffRow(0);
    } catch (error) {
      context.toast.error(`Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return;
  }

  // Toggle view mode with Ctrl+T
  if (ctrl && key === "t" && !context.isEditMode()) {
    const current = context.diffViewMode();
    context.setDiffViewMode(current === "unified" ? "side-by-side" : "unified");
    return;
  }

  // Enter edit mode with 'i' (works in both side-by-side and unified mode)
  if (key === "i" && !context.isEditMode()) {
    const selectedFile = context.gitStatus.selectedFile();
    const selectedPath = selectedFile?.path?.trim();
    if (!selectedPath) {
      logger.warn("Attempted to enter edit mode without a valid selected file path");
      return;
    }

    try {
      // Get the diff to find which line we're on
      const diffContent = await context.gitService.getDiff(selectedPath);
      if (!diffContent) {
        context.toast.error("No diff available");
        return;
      }

      // Parse based on current view mode
      let lineNum: number | null = null;

      if (context.diffViewMode() === "side-by-side") {
        const diffRows = parseSideBySideDiff(diffContent);
        const selectedRow = diffRows[context.selectedDiffRow()];
        lineNum = selectedRow?.rightLineNum ?? null;
      } else {
        // Unified mode
        const diffLines = parseDiffLines(diffContent);
        const selectedLine = diffLines[context.selectedDiffRow()];
        lineNum = selectedLine?.newLineNum ?? null;
      }

      // Only allow editing if there's a valid line number
      if (lineNum === null) {
        context.toast.info("Cannot edit this line");
        return;
      }

      // Load the full file content
      const fullContent = await context.gitService.readFile(selectedPath);
      const lines = fullContent.split('\n');

      // Validate line number is within bounds
      const lineIndex = lineNum - 1;
      if (lineIndex < 0 || lineIndex >= lines.length) {
        context.toast.error("Line number out of bounds. File may have changed.");
        return;
      }

      context.setFileContent(fullContent);
      context.setSelectedLine(lineIndex);
      context.setEditedContent(lines[lineIndex]);

      // Enter edit mode
      context.setIsEditMode(true);
    } catch (error) {
      context.toast.error(`Failed to enter edit mode: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return;
  }

  // Exit edit mode with Escape
  if (key === "escape") {
    if (context.isEditMode()) {
      // Clear all edit state when exiting edit mode
      const editCount = context.editedLines().size;
      context.setIsEditMode(false);
      context.setEditedContent("");
      context.setEditedLines(new Map());
      context.setFileContent("");
      if (editCount > 0) {
        context.toast.info(`Discarded ${editCount} unsaved change${editCount > 1 ? 's' : ''}`);
      }
      return;
    }
    // Return to files panel and reset diff scroll position
    context.setSelectedDiffRow(0);
    context.setActivePanel("files");
    return;
  }

  // Navigation in edit mode: ONLY arrow keys (not j/k) so user can type those letters
  if (context.isEditMode()) {
    if (key === "down") {
      saveCurrentEdit();
      const lines = context.fileContent().split('\n');
      const newIndex = Math.min(context.selectedLine() + 1, lines.length - 1);
      context.setSelectedLine(newIndex);

      // Load content for new line (from editedLines if exists, otherwise from file)
      if (newIndex >= 0 && newIndex < lines.length) {
        const lineNumber = newIndex + 1; // Convert to 1-based
        const existingEdit = context.editedLines().get(lineNumber);
        context.setEditedContent(existingEdit ?? lines[newIndex]);
      } else {
        // Clear if out of bounds
        context.setEditedContent("");
      }
      return;
    }

    if (key === "up") {
      saveCurrentEdit();
      const newIndex = Math.max(context.selectedLine() - 1, 0);
      context.setSelectedLine(newIndex);

      // Load content for new line (from editedLines if exists, otherwise from file)
      const lines = context.fileContent().split('\n');
      if (newIndex >= 0 && newIndex < lines.length) {
        const lineNumber = newIndex + 1; // Convert to 1-based
        const existingEdit = context.editedLines().get(lineNumber);
        context.setEditedContent(existingEdit ?? lines[newIndex]);
      } else {
        // Clear if out of bounds
        context.setEditedContent("");
      }
      return;
    }

    // In edit mode, allow all other keys to go to the textbox (don't block)
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
