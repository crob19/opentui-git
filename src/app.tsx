import { createSignal } from "solid-js";
import { useRenderer } from "@opentui/solid";
import { GitService } from "./git-service.js";
import { DialogProvider, useDialog } from "./components/dialog.js";
import { ToastProvider, useToast } from "./components/toast.js";
import { ErrorBoundary } from "./components/error-boundary.js";
import { AppLayout } from "./components/app-layout.js";
import {
  useGitStatus,
  useGitBranches,
  useGitDiff,
  useAutoRefresh,
  useCommandHandler,
} from "./hooks/index.js";
import type { PanelType } from "./commands/types.js";

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

  // Custom hooks handle all git-related state & resources
  const gitStatus = useGitStatus(gitService);
  const gitBranches = useGitBranches(gitService);
  const gitDiff = useGitDiff(gitService, gitStatus.selectedFile);

  // Command handler sets up all keyboard bindings
  useCommandHandler({
    gitService,
    toast,
    dialog,
    activePanel,
    setActivePanel,
    gitStatus,
    gitBranches,
    renderer,
  });

  // Auto-refresh git status and branches every second
  useAutoRefresh(dialog, gitStatus.refetch, gitBranches.refetchBranches);

  return (
    <AppLayout
      gitStatus={gitStatus.gitStatus}
      localBranches={gitBranches.localBranches}
      currentBranch={gitBranches.currentBranch}
      diffContent={gitDiff.diffContent}
      selectedFile={gitStatus.selectedFile}
      selectedIndex={gitStatus.selectedIndex}
      branchSelectedIndex={gitBranches.selectedIndex}
      activePanel={activePanel}
      isGitRepo={gitStatus.isGitRepo}
      errorMessage={gitStatus.errorMessage}
      isDiffLoading={gitDiff.isLoading}
      flatNodes={gitStatus.flatNodes}
    />
  );
}
