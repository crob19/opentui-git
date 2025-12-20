import { createSignal, createResource, createEffect, Show } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import { GitService } from "./git-service.js";
import { Header } from "./components/header.js";
import { FileList } from "./components/file-list.js";
import { DiffViewer } from "./components/diff-viewer.js";
import { Footer } from "./components/footer.js";
import { DialogProvider, useDialog } from "./components/dialog.js";
import { ToastProvider, useToast } from "./components/toast.js";
import { CommitDialog } from "./components/commit-dialog.js";
import { BranchDialog } from "./components/branch-dialog.js";
import { BranchSwitcherDialog } from "./components/branch-switcher-dialog.js";
import type { GitStatusSummary } from "./types.js";

/**
 * Main application component
 * Handles git operations, keyboard input, and UI state
 */
export function App() {
  return (
    <ToastProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const gitService = new GitService();
  const renderer = useRenderer();
  const dialog = useDialog();
  const toast = useToast();
  
  // Log startup
  console.log("opentui-git started");
  console.log("Press Ctrl+\\ to toggle console overlay");
  console.log("Press Ctrl+D to toggle debug panel (FPS stats)");
  
  // State
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isGitRepo, setIsGitRepo] = createSignal(true);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  // Load git status
  const [gitStatus, { refetch }] = createResource<GitStatusSummary>(async () => {
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
      
      // Reset selected index if files list changed
      if (selectedIndex() >= status.files.length) {
        setSelectedIndex(Math.max(0, status.files.length - 1));
      }
      
      return status;
    } catch (error) {
      console.error("Error loading git status:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  });

  // Track the selected file for diff loading
  const selectedFile = () => {
    const status = gitStatus();
    if (!status || status.files.length === 0) return null;
    return status.files[selectedIndex()] || null;
  };

  // Load diff for selected file
  const [diffContent, { refetch: refetchDiff }] = createResource(
    () => selectedFile()?.path,
    async (filePath) => {
      if (!filePath) return null;
      try {
        const file = selectedFile();
        const staged = file?.staged || false;
        console.log(`Loading diff for: ${filePath} (staged: ${staged})`);
        const diff = await gitService.getDiff(filePath, staged);
        return diff || null;
      } catch (error) {
        console.error("Error loading diff:", error);
        return null;
      }
    }
  );

  // Refetch diff when selected file changes
  createEffect(() => {
    const file = selectedFile();
    if (file) {
      refetchDiff();
    }
  });

  // Keyboard handler
  const handleKeyPress = async (key: string, ctrl: boolean) => {
    // Skip all key handling when dialog is open (let dialog handle its own keys)
    if (dialog.isOpen) {
      return;
    }
    
    console.log(`Key pressed: "${key}", ctrl: ${ctrl}`);
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

    const status = gitStatus();
    if (!status || status.files.length === 0) return;

    try {
      switch (key) {
        // Navigation
        case "j":
        case "down":
          setSelectedIndex((prev) => {
            const next = Math.min(prev + 1, status.files.length - 1);
            console.log(`Navigation down: ${prev} -> ${next} (max: ${status.files.length - 1})`);
            return next;
          });
          break;

        case "k":
        case "up":
          setSelectedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            console.log(`Navigation up: ${prev} -> ${next}`);
            return next;
          });
          break;

        // Stage/unstage current file
        case " ":
        case "space":
          const file = status.files[selectedIndex()];
          if (file) {
            if (file.staged) {
              console.log(`Unstaging: ${file.path}`);
              await gitService.unstageFile(file.path);
              toast.info(`Unstaged: ${file.path}`);
            } else {
              console.log(`Staging: ${file.path}`);
              await gitService.stageFile(file.path);
              toast.info(`Staged: ${file.path}`);
            }
            await refetch();
          }
          break;

        // Stage all
        case "a":
          console.log("Staging all files");
          await gitService.stageAll();
          toast.success("Staged all files");
          await refetch();
          break;

        // Unstage all
        case "u":
          console.log("Unstaging all files");
          await gitService.unstageAll();
          toast.info("Unstaged all files");
          await refetch();
          break;

        // Refresh
        case "r":
          console.log("Refreshing git status");
          await refetch();
          toast.info("Refreshed");
          break;

        // Commit
        case "c":
          const stagedFiles = status.files.filter((f) => f.staged);
          if (stagedFiles.length === 0) {
            console.log("No staged files to commit");
            toast.warning("No staged files to commit");
            break;
          }
          console.log(`Opening commit dialog for ${stagedFiles.length} staged files`);
          dialog.show(
            () => (
              <CommitDialog
                stagedCount={stagedFiles.length}
                onCommit={async (message) => {
                  try {
                    console.log(`Committing with message: ${message}`);
                    await gitService.commit(message);
                    console.log("Commit successful");
                    toast.success("Commit successful");
                    await refetch();
                  } catch (error) {
                    console.error("Commit failed:", error);
                    toast.error(error instanceof Error ? error.message : "Commit failed");
                    setErrorMessage(error instanceof Error ? error.message : "Commit failed");
                  }
                }}
                onCancel={() => {
                  console.log("Commit cancelled");
                }}
              />
            ),
            () => console.log("Dialog closed")
          );
          break;

        // Pull
        case "p":
          console.log("Pulling from remote...");
          toast.info("Pulling from remote...");
          try {
            await gitService.pull();
            console.log("Pull successful");
            toast.success("Pull successful");
            await refetch();
          } catch (error) {
            console.error("Pull failed:", error);
            toast.error(error instanceof Error ? error.message : "Pull failed");
            setErrorMessage(error instanceof Error ? error.message : "Pull failed");
          }
          break;

        // Push
        case "P":
          console.log("Pushing to remote...");
          toast.info("Pushing to remote...");
          try {
            await gitService.push();
            console.log("Push successful");
            toast.success("Push successful");
            await refetch();
          } catch (error) {
            console.error("Push failed:", error);
            toast.error(error instanceof Error ? error.message : "Push failed");
            setErrorMessage(error instanceof Error ? error.message : "Push failed");
          }
          break;

        // New branch
        case "n":
          console.log("Opening new branch dialog");
          dialog.show(
            () => (
              <BranchDialog
                currentBranch={status.current}
                onCreateBranch={async (branchName) => {
                  try {
                    console.log(`Creating branch: ${branchName}`);
                    await gitService.createBranch(branchName);
                    console.log(`Branch created and checked out: ${branchName}`);
                    toast.success(`Switched to new branch: ${branchName}`);
                    await refetch();
                  } catch (error) {
                    console.error("Failed to create branch:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to create branch");
                    setErrorMessage(error instanceof Error ? error.message : "Failed to create branch");
                  }
                }}
                onCancel={() => {
                  console.log("Branch creation cancelled");
                }}
              />
            ),
            () => console.log("Branch dialog closed")
          );
          break;

        // Switch branch
        case "b":
          console.log("Opening branch switcher dialog");
          try {
            const branches = await gitService.getBranches();
            dialog.show(
              () => (
                <BranchSwitcherDialog
                  branches={branches}
                  onSwitch={async (branchName) => {
                    try {
                      console.log(`Switching to branch: ${branchName}`);
                      await gitService.checkoutBranch(branchName);
                      console.log(`Switched to branch: ${branchName}`);
                      toast.success(`Switched to branch: ${branchName}`);
                      await refetch();
                    } catch (error) {
                      console.error("Failed to switch branch:", error);
                      toast.error(error instanceof Error ? error.message : "Failed to switch branch");
                    }
                  }}
                  onCancel={() => {
                    console.log("Branch switch cancelled");
                  }}
                />
              ),
              () => console.log("Branch switcher dialog closed")
            );
          } catch (error) {
            console.error("Failed to load branches:", error);
            toast.error("Failed to load branches");
          }
          break;

        // Quit
        case "q":
          if (!ctrl) {
            process.exit(0);
          }
          break;
      }
    } catch (error) {
      console.error("Error handling key press:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Set up keyboard listener using OpenTUI hook
  useKeyboard((event) => {
    const key = event.name || event.sequence;
    const ctrl = event.ctrl || false;
    handleKeyPress(key, ctrl);
  });

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
    >
      <Show
        when={isGitRepo() && !errorMessage()}
        fallback={
          <box
            width="100%"
            height="100%"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <text fg="#FF4444">
              Error
            </text>
            <text fg="#AAAAAA">
              {errorMessage() || "Not a git repository"}
            </text>
            <text fg="#888888">
              Press 'q' to quit
            </text>
          </box>
        }
      >
        <Header status={() => gitStatus() || null} />
        <box flexDirection="row" flexGrow={1} gap={0}>
          <box width="40%" flexDirection="column">
            <FileList
              files={() => gitStatus()?.files || []}
              selectedIndex={selectedIndex}
            />
          </box>
          <box width="60%" flexDirection="column">
            <DiffViewer
              diff={() => diffContent() || null}
              filePath={() => selectedFile()?.path || null}
              isLoading={() => diffContent.loading}
            />
          </box>
        </box>
        <Footer />
      </Show>
    </box>
  );
}
