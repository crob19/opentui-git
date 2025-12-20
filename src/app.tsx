import { createSignal, createResource, Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { GitService } from "./git-service.js";
import { Header } from "./components/header.js";
import { FileList } from "./components/file-list.js";
import { Footer } from "./components/footer.js";
import type { GitStatusSummary } from "./types.js";

/**
 * Main application component
 * Handles git operations, keyboard input, and UI state
 */
export function App() {
  const gitService = new GitService();
  
  // Log startup
  console.log("opentui-git started");
  console.log("Press Ctrl+\\ to toggle console overlay for logs");
  
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

  // Keyboard handler
  const handleKeyPress = async (key: string, ctrl: boolean) => {
    const status = gitStatus();
    if (!status || status.files.length === 0) return;

    try {
      switch (key) {
        // Navigation
        case "j":
        case "down":
          setSelectedIndex((prev) => Math.min(prev + 1, status.files.length - 1));
          break;

        case "k":
        case "up":
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        // Stage/unstage current file
        case " ":
        case "space":
          const file = status.files[selectedIndex()];
          if (file) {
            if (file.staged) {
              console.log(`Unstaging: ${file.path}`);
              await gitService.unstageFile(file.path);
            } else {
              console.log(`Staging: ${file.path}`);
              await gitService.stageFile(file.path);
            }
            await refetch();
          }
          break;

        // Stage all
        case "a":
          console.log("Staging all files");
          await gitService.stageAll();
          await refetch();
          break;

        // Unstage all
        case "u":
          console.log("Unstaging all files");
          await gitService.unstageAll();
          await refetch();
          break;

        // Refresh
        case "r":
          console.log("Refreshing git status");
          await refetch();
          break;

        // Quit
        case "q":
          if (!ctrl) {
            process.exit(0);
          }
          break;

        // Ctrl+C always quits
        case "c":
          if (ctrl) {
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
        <Header status={gitStatus() || null} />
        <FileList
          files={gitStatus()?.files || []}
          selectedIndex={selectedIndex()}
        />
        <Footer />
      </Show>
    </box>
  );
}
