import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";

export interface TUIOptions {
  port?: number;
  serverUrl?: string;
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
 */
export async function startTUI(options: TUIOptions = {}) {
  const { port = 4096, serverUrl } = options;
  
  let actualServerUrl = serverUrl;
  
  // If no server URL provided, start our own server
  if (!actualServerUrl) {
    const { startServer } = await import("../server/index.js");
    await startServer({ port });
    actualServerUrl = `http://localhost:${port}`;
  }
  
  // Store server URL for components to use
  (globalThis as Record<string, unknown>).__OPENTUI_GIT_SERVER_URL__ = actualServerUrl;
  
  // Handle SIGTERM
  process.on("SIGTERM", () => {
    executeShutdown();
  });
  
  console.log("opentui-git started");
  console.log("Press Ctrl+\\ to toggle console overlay");
  console.log("Press Ctrl+D to toggle debug panel (FPS stats)");
  
  // Render the app
  render(
    () => <App />,
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
}
