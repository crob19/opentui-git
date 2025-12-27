import { createSignal, createEffect } from "solid-js";
import { useRenderer } from "@opentui/solid";
import { GitService } from "./git-service.js";
import { DialogProvider, useDialog } from "./components/dialog.js";
import { ToastProvider, useToast } from "./components/toast.js";
import { ErrorBoundary } from "./components/error-boundary.js";
import { AppLayout } from "./components/app-layout.js";
import {
  useGitStatus,
  useGitBranches,
  useGitTags,
  useGitDiff,
  useAutoRefresh,
  useCommandHandler,
} from "./hooks/index.js";
import type { PanelType } from "./commands/types.js";
import { registerShutdownHandler } from "./index.js";

/**
 * Tab types for the branches panel
 */
export type BranchPanelTab = "branches" | "tags";

/**
 * Main application component
 * Provides context providers for dialogs and toasts
 */
export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DialogProvider>
          <AppContent />
        </DialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

/**
 * Application content component
 * Handles git operations, keyboard input, and UI state
 * Orchestrates all hooks and passes state to layout component
 */
function AppContent() {
  const gitService = new GitService();
  const renderer = useRenderer();
  const dialog = useDialog();
  const toast = useToast();

  // Log startup
  console.log("opentui-git started");
  console.log("Press Ctrl+\\ to toggle console overlay");
  console.log("Press Ctrl+D to toggle debug panel (FPS stats)");

  // Panel navigation state
  const [activePanel, setActivePanel] = createSignal<PanelType>("files");
  
  // Branch panel tab state (branches vs tags)
  const [branchPanelTab, setBranchPanelTab] = createSignal<BranchPanelTab>("branches");

  // Diff panel state
  const [selectedDiffRow, setSelectedDiffRow] = createSignal(0);
  const [diffViewMode, setDiffViewMode] = createSignal<"unified" | "side-by-side">("side-by-side");

  // Edit mode state
  const [isEditMode, setIsEditMode] = createSignal(false);
  const [editedContent, setEditedContent] = createSignal("");
  // Track all edited lines: Map<lineNumber, editedContent>
  const [editedLines, setEditedLines] = createSignal<Map<number, string>>(new Map());
  const [fileContent, setFileContent] = createSignal("");
  const [selectedLine, setSelectedLine] = createSignal(0);
  const [fileMtime, setFileMtime] = createSignal<Date | null>(null);

  // Custom hooks handle all git-related state & resources
  const gitStatus = useGitStatus(gitService);
  const gitBranches = useGitBranches(gitService);
  const gitTags = useGitTags(gitService);
  const gitDiff = useGitDiff(gitService, gitStatus.selectedFile);

  // Auto-refresh git status, branches, and tags every second
  // Returns cleanup function for graceful shutdown
  const cleanupAutoRefresh = useAutoRefresh(dialog, gitStatus.refetch, gitBranches.refetchBranches, gitTags.refetchTags);

  // Register cleanup handlers for graceful shutdown
  // These will be called when the app exits via q, Ctrl+C, or SIGTERM
  registerShutdownHandler(() => {
    // Clean up auto-refresh interval
    cleanupAutoRefresh();
  });

  registerShutdownHandler(() => {
    // Destroy the OpenTUI renderer to stop the event loop
    try {
      renderer.destroy();
    } catch (error) {
      console.error("Renderer destroy failed:", error);
    }
  });

  // Command handler sets up all keyboard bindings
  useCommandHandler({
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
    fileMtime,
    setFileMtime,
    refetchDiff: gitDiff.refetch,
  });

  // Track last file path to detect actual file changes (not just refreshes)
  const [lastFilePath, setLastFilePath] = createSignal<string | null>(null);
  
  // Reset diff scroll position when file path actually changes
  createEffect(() => {
    const file = gitStatus.selectedFile();
    const currentPath = file?.path || null;
    
    // Only reset if the file path actually changed
    if (currentPath !== lastFilePath()) {
      setLastFilePath(currentPath);
      setSelectedDiffRow(0);
    }
  });

  return (
    <AppLayout
      gitStatus={gitStatus.gitStatus}
      localBranches={gitBranches.localBranches}
      currentBranch={gitBranches.currentBranch}
      allTags={gitTags.allTags}
      diffContent={gitDiff.diffContent}
      selectedFile={gitStatus.selectedFile}
      selectedIndex={gitStatus.selectedIndex}
      branchSelectedIndex={gitBranches.selectedIndex}
      tagSelectedIndex={gitTags.selectedIndex}
      activePanel={activePanel}
      branchPanelTab={branchPanelTab}
      isGitRepo={gitStatus.isGitRepo}
      errorMessage={gitStatus.errorMessage}
      isDiffLoading={gitDiff.isLoading}
      flatNodes={gitStatus.flatNodes}
      selectedDiffRow={selectedDiffRow}
      setSelectedDiffRow={setSelectedDiffRow}
      diffViewMode={diffViewMode}
      setDiffViewMode={setDiffViewMode}
      isEditMode={isEditMode}
      setIsEditMode={setIsEditMode}
      editedContent={editedContent}
      setEditedContent={setEditedContent}
      editedLines={editedLines}
      setEditedLines={setEditedLines}
      fileContent={fileContent}
      setFileContent={setFileContent}
      selectedLine={selectedLine}
      setSelectedLine={setSelectedLine}
      gitService={gitService}
      refetchDiff={gitDiff.refetch}
    />
  );
}
