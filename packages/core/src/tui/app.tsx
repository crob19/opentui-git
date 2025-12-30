// IMMEDIATE LOG AT MODULE LOAD TIME - CACHE_BUST_v3
console.log("[APP.TSX] ===== MODULE LOADED AT", new Date().toISOString(), "=====");

import { createSignal, createEffect } from "solid-js";
import { useRenderer } from "@opentui/solid";
import { createClient } from "@opentui-git/sdk";
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
import type { DiffMode } from "../git/types.js";
import { registerShutdownHandler } from "./index.js";
import { logger } from "./utils/logger.js";

/**
 * Tab types for the branches panel
 */
export type BranchPanelTab = "branches" | "tags";

/**
 * Get the server URL from global state (set by tui/index.tsx)
 */
function getServerUrl(): string {
  const url = ((globalThis as Record<string, unknown>).__OPENTUI_GIT_SERVER_URL__ as string) || "http://localhost:5050";
  logger.debug("[app] getServerUrl:", url);
  return url;
}

/**
 * Main application component
 * Provides context providers for dialogs and toasts
 * CACHE_BUST_20251230_v2
 */
export function App() {
  console.log("[APP] ========== App() CALLED (CACHE_BUST_v2) ==========");
  logger.debug("[app] App() function executing");
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
  console.log("[APPCONTENT] ========== AppContent INIT ==========");
  console.log("[APPCONTENT] Step 1: Getting server URL...");
  
  const serverUrl = getServerUrl();
  console.log("[APPCONTENT] Step 2: Server URL:", serverUrl);
  console.log("[APPCONTENT] Step 3: Creating client...");
  const client = createClient(serverUrl);
  console.log("[APPCONTENT] Step 4: Client created");
  
  console.log("[APPCONTENT] Step 5: Getting renderer...");
  const renderer = useRenderer();
  console.log("[APPCONTENT] Step 6: Renderer obtained:", !!renderer);
  
  console.log("[APPCONTENT] Step 7: Getting dialog and toast...");
  const dialog = useDialog();
  const toast = useToast();
  console.log("[APPCONTENT] Step 8: Dialog and toast providers obtained");

  // Test server connectivity
  logger.debug("[app] Testing server connectivity...");
  client.health()
    .then(() => logger.debug("[app] Server health: OK"))
    .catch((err) => logger.error("[app] Server health: FAILED", err));
  
  // Test git repo info
  client.getRepoInfo()
    .then((info) => logger.debug("[app] Repo info:", JSON.stringify(info)))
    .catch((err) => logger.error("[app] Repo info: FAILED", err));

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
  const [diffMode, setDiffMode] = createSignal<DiffMode>("unstaged");
  const [compareBranch, setCompareBranch] = createSignal<string | null>(null);
  const [isCompareBranchLoading, setIsCompareBranchLoading] = createSignal(true);

  // Initialize compareBranch with the default branch (main or master)
  // This runs once on startup and is properly tracked
  createEffect(() => {
    client.getDefaultBranch()
      .then((branch) => {
        setCompareBranch(branch);
        setIsCompareBranchLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get default branch:", error);
        setCompareBranch("main"); // Fallback to main
        setIsCompareBranchLoading(false);
      });
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = createSignal(false);
  const [editedContent, setEditedContent] = createSignal("");
  // Track all edited lines: Map<lineNumber, editedContent>
  const [editedLines, setEditedLines] = createSignal<Map<number, string>>(new Map());
  const [fileContent, setFileContent] = createSignal("");
  const [selectedLine, setSelectedLine] = createSignal(0);
  const [fileMtime, setFileMtime] = createSignal<Date | null>(null);

  // Custom hooks handle all git-related state & resources
  logger.debug("[app] Calling useGitStatus...");
  const gitStatus = useGitStatus(client, diffMode, compareBranch);
  logger.debug("[app] useGitStatus completed");
  
  logger.debug("[app] Calling useGitBranches...");
  const gitBranches = useGitBranches(client);
  logger.debug("[app] useGitBranches completed");
  
  logger.debug("[app] Calling useGitTags...");
  const gitTags = useGitTags(client);
  logger.debug("[app] useGitTags completed");
  
  logger.debug("[app] Calling useGitDiff...");
  const gitDiff = useGitDiff(client, gitStatus.selectedFile, diffMode, compareBranch);
  logger.debug("[app] useGitDiff completed");

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
    client,
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
    diffMode,
    setDiffMode,
    compareBranch,
    setCompareBranch,
    isCompareBranchLoading,
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
      diffMode={diffMode}
      compareBranch={compareBranch}
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
      client={client}
      refetchDiff={gitDiff.refetch}
    />
  );
}
