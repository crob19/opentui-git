import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";
import { logger } from "./utils/logger.js";

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
 */
export async function startTUI(options: TUIOptions) {
  const { serverUrl } = options;
  
  logger.debug("[tui] ========== TUI STARTUP ==========");
  logger.debug("[tui] Server URL:", serverUrl);
  logger.debug("[tui] CWD:", process.cwd());
  logger.debug("[tui] Process ID:", process.pid);
  
  // Store server URL for components to use
  (globalThis as Record<string, unknown>).__OPENTUI_GIT_SERVER_URL__ = serverUrl;
  logger.debug("[tui] Server URL stored in globalThis");
  
  // Handle SIGTERM
  process.on("SIGTERM", () => {
    logger.debug("[tui] Received SIGTERM");
    executeShutdown();
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
  
  // Render the app
  logger.debug("[tui] Starting render...");
  logger.debug("[tui] App component:", typeof App);
  console.log("[TUI] About to call render() with App component");
  await render(
    App,
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
}
