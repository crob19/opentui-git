import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";
import { logger } from "./utils/logger.js";
import { ErrorBoundary } from "./components/error-boundary.js";
import { ToastProvider } from "./components/toast.js";
import { DialogProvider } from "./components/dialog.js";

export interface TUIOptions {
  serverUrl: string;
}

// Global shutdown registry
const shutdownHandlers: (() => void)[] = [];

/**
 * Register a cleanup handler to be called during shutdown
 */
export function registerShutdownHandler(handler: () => void) {
  shutdownHandlers.push(handler);
}

/**
 * Execute all registered shutdown handlers and exit
 */
export function executeShutdown() {
  console.log("Executing shutdown handlers...");
  
  for (const handler of shutdownHandlers) {
    try {
      handler();
    } catch (error) {
      console.error("Shutdown handler error:", error);
    }
  }
  
  console.log("Shutdown complete, exiting process");
  process.exit(0);
}

/**
 * Start the TUI
 * Note: Server must already be running - this only handles the UI
 * Following OpenCode's architecture pattern
 */
export function startTUI(options: TUIOptions) {
  const { serverUrl } = options;
  
  // Return a promise to prevent immediate exit (matches OpenCode pattern)
  return new Promise<void>(async (resolve) => {
    logger.debug("[tui] ========== TUI STARTUP ==========");
    logger.debug("[tui] Server URL:", serverUrl);
    logger.debug("[tui] CWD:", process.cwd());
    logger.debug("[tui] Process ID:", process.pid);
    
    // Store server URL for components to use
    (globalThis as Record<string, unknown>).__OPENTUI_GIT_SERVER_URL__ = serverUrl;
    logger.debug("[tui] Server URL stored in globalThis");
    
    const onExit = async () => {
      executeShutdown();
      resolve();
    };
    
    // Handle SIGTERM
    process.on("SIGTERM", () => {
      logger.debug("[tui] Received SIGTERM");
      onExit();
    });
    
    console.log("opentui-git started");
    console.log("Press Ctrl+\\ to toggle console overlay");
    console.log("Press Ctrl+D to toggle debug panel (FPS stats)");
    
    // Test server connectivity before rendering
    logger.debug("[tui] Testing server connectivity...");
    try {
      const healthResponse = await fetch(`${serverUrl}/health`);
      if (healthResponse.ok) {
        logger.debug("[tui] Server health check: OK");
      } else {
        logger.error("[tui] Server health check failed:", healthResponse.status, healthResponse.statusText);
      }
    } catch (error) {
      logger.error("[tui] Server health check error:", error);
    }
    
    // Render the app - pass a function that returns the component tree (matches OpenCode)
    // CRITICAL: ALL providers and ErrorBoundary must be inside this function
    // This ensures the renderer context is properly established before any components render
    logger.debug("[tui] Starting render...");
    console.log("[TUI] About to call render() with App component");
    
    render(
      () => (
        <ErrorBoundary>
          <ToastProvider>
            <DialogProvider>
              <App />
            </DialogProvider>
          </ToastProvider>
        </ErrorBoundary>
      ),
      {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: false,
        consoleOptions: {
          keyBindings: [{ name: "y", ctrl: true, action: "copy-selection" }],
          onCopySelection: (text) => {
            Clipboard.copy(text)
              .then(() => console.log(`Copied ${text.length} characters to clipboard`))
              .catch((err) => console.error("Copy failed:", err));
          },
        },
      }
    );
    logger.debug("[tui] Render completed");
  });
}
