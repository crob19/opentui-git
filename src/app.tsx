import { createSignal, createResource, createEffect, Show, onCleanup } from "solid-js";
import { useKeyboard, useRenderer } from "@opentui/solid";
import { GitService } from "./git-service.js";
import { Header } from "./components/header.js";
import { FileList } from "./components/file-list.js";
import { BranchList } from "./components/branch-list.js";
import { DiffViewer } from "./components/diff-viewer.js";
import { Footer } from "./components/footer.js";
import { DialogProvider, useDialog } from "./components/dialog.js";
import { ToastProvider, useToast } from "./components/toast.js";
import { CommitDialog } from "./components/commit-dialog.js";
import { BranchDialog } from "./components/branch-dialog.js";
import { DeleteBranchDialog } from "./components/delete-branch-dialog.js";
import { MergeBranchDialog } from "./components/merge-branch-dialog.js";
import type { GitStatusSummary, GitBranchInfo } from "./types.js";

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
  const [branchSelectedIndex, setBranchSelectedIndex] = createSignal(0);
  const [activePanel, setActivePanel] = createSignal<"files" | "branches">("files");
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

  // Load branches
  const [branches, { refetch: refetchBranches }] = createResource<GitBranchInfo>(async () => {
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
    return list[branchSelectedIndex()] || null;
  };

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

  // Helper function to show the new branch dialog
  const showNewBranchDialog = (currentBranchName: string, shouldSelectNewBranch: boolean = false) => {
    console.log("Opening new branch dialog");
    dialog.show(
      () => (
        <BranchDialog
          currentBranch={currentBranchName}
          onCreateBranch={async (branchName: string) => {
            try {
              console.log(`Creating branch: ${branchName}`);
              await gitService.createBranch(branchName);
              console.log(`Branch created and checked out: ${branchName}`);
              toast.success(`Switched to new branch: ${branchName}`);
              await refetch();
              await refetchBranches();
              // After creating and checking out the new branch from the branches panel,
              // it will be sorted to the top of the branch list; select it explicitly.
              if (shouldSelectNewBranch) {
                setBranchSelectedIndex(0);
              }
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
  };

  // Keyboard handler
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

    const status = gitStatus();
    const branchList = localBranches();
    const currentBranch = branches()?.current || "";
    
    // Handle quit regardless of status
    if (key === "q" && !ctrl) {
      process.exit(0);
    }
    
    // Handle pull/push regardless of file status
    if (key === "p" || key === "P") {
      if (shift) {
        // Push
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
      } else {
        // Pull
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
      }
      return;
    }

    // Toggle between panels with Tab
    if (key === "tab") {
      setActivePanel((prev) => prev === "files" ? "branches" : "files");
      return;
    }

    try {
      // Panel-specific key handling
      if (activePanel() === "branches") {
        // Branches panel keys
        switch (key) {
          case "j":
          case "down":
            setBranchSelectedIndex((prev) => Math.min(prev + 1, branchList.length - 1));
            break;

          case "k":
          case "up":
            setBranchSelectedIndex((prev) => Math.max(prev - 1, 0));
            break;

          // Checkout branch with space
          case " ":
          case "space":
            const branch = selectedBranch();
            if (branch && branch !== currentBranch) {
              console.log(`Checking out branch: ${branch}`);
              toast.info(`Switching to ${branch}...`);
              try {
                await gitService.checkoutBranch(branch);
                console.log(`Switched to branch: ${branch}`);
                toast.success(`Switched to branch: ${branch}`);
                await refetch();
                await refetchBranches();
              } catch (error) {
                console.error("Failed to switch branch:", error);
                toast.error(error instanceof Error ? error.message : "Failed to switch branch");
              }
            } else if (branch === currentBranch) {
              toast.info("Already on this branch");
            }
            break;

          // Delete branch with 'd'
          case "d":
            const branchToDelete = selectedBranch();
            if (!branchToDelete) break;
            
            if (branchToDelete === currentBranch) {
              toast.warning("Cannot delete the current branch");
              break;
            }
            
            console.log(`Opening delete confirmation for branch: ${branchToDelete}`);
            dialog.show(
              () => (
                <DeleteBranchDialog
                  branchName={branchToDelete}
                  onConfirm={async () => {
                    try {
                      console.log(`Deleting branch: ${branchToDelete}`);
                      await gitService.deleteBranch(branchToDelete);
                      console.log(`Branch deleted: ${branchToDelete}`);
                      toast.success(`Deleted branch: ${branchToDelete}`);
                      const updatedBranches = await refetchBranches();
                      const branchCount = updatedBranches?.all?.length ?? 0;
                      // Reset selection if needed
                      if (branchSelectedIndex() >= branchCount) {
                        setBranchSelectedIndex(Math.max(0, branchCount - 1));
                      }
                    } catch (error) {
                      console.error("Failed to delete branch:", error);
                      toast.error(error instanceof Error ? error.message : "Failed to delete branch");
                    }
                  }}
                  onCancel={() => {
                    console.log("Branch deletion cancelled");
                  }}
                />
              ),
              () => console.log("Delete branch dialog closed")
            );
            break;

          // New branch
          case "n":
            showNewBranchDialog(currentBranch, true);
            break;

          // Merge branch with 'M' (Shift+m)
          case "m":
            if (!shift) break; // Only trigger on Shift+m
            const branchToMerge = selectedBranch();
            if (!branchToMerge) break;
            
            if (branchToMerge === currentBranch) {
              toast.warning("Cannot merge a branch into itself");
              break;
            }
            
            console.log(`Opening merge confirmation for branch: ${branchToMerge} into ${currentBranch}`);
            dialog.show(
              () => (
                <MergeBranchDialog
                  sourceBranch={branchToMerge}
                  targetBranch={currentBranch}
                  onConfirm={async () => {
                    try {
                      console.log(`Merging branch: ${branchToMerge} into ${currentBranch}`);
                      const result = await gitService.mergeBranch(branchToMerge);
                      console.log(`Merge result:`, result);
                      
                      if (result.files.length === 0 && result.merges.length === 0) {
                        toast.info("Already up to date");
                      } else {
                        toast.success(`Merged ${branchToMerge} into ${currentBranch}`);
                      }
                      await refetch();
                      await refetchBranches();
                    } catch (error) {
                      console.error("Failed to merge branch:", error);
                      toast.error(error instanceof Error ? error.message : "Merge failed");
                    }
                  }}
                  onCancel={() => {
                    console.log("Branch merge cancelled");
                  }}
                />
              ),
              () => console.log("Merge branch dialog closed")
            );
            break;
        }
      } else {
        // Files panel keys
        if ((!status || status.files.length === 0) && key !== "n") return;

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

          // New branch (also available from files panel)
          case "n":
            showNewBranchDialog(status.current, false);
            break;
        }
      }
    } catch (error) {
      console.error("Error handling key press:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
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

  // Auto-refresh git status every 1 second (similar to lazygit's approach)
  const refreshInterval = setInterval(() => {
    if (!dialog.isOpen) {
      refetch();
      refetchBranches();
    }
  }, 1000);

  onCleanup(() => {
    clearInterval(refreshInterval);
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
          <box width="30%" flexDirection="column">
            <box height="60%" flexDirection="column">
              <FileList
                files={() => gitStatus()?.files || []}
                selectedIndex={selectedIndex}
                isActive={() => activePanel() === "files"}
              />
            </box>
            <box height="40%" flexDirection="column">
              <BranchList
                branches={localBranches}
                currentBranch={() => branches()?.current || ""}
                selectedIndex={branchSelectedIndex}
                isActive={() => activePanel() === "branches"}
              />
            </box>
          </box>
          <box width="70%" flexDirection="column">
            <DiffViewer
              diff={() => diffContent() || null}
              filePath={() => selectedFile()?.path || null}
              isLoading={() => diffContent.loading}
            />
          </box>
        </box>
        <Footer activePanel={activePanel} />
      </Show>
    </box>
  );
}
