import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";
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
  for (const handler of shutdownHandlers) {
    try {
      handler();
    } catch (error) {
      console.error("Shutdown handler error:", error);
    }
  }

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
    // Store server URL for components to use
    (globalThis as Record<string, unknown>).__OPENTUI_GIT_SERVER_URL__ = serverUrl;

    const onExit = async () => {
      executeShutdown();
      resolve();
    };

    // Handle SIGTERM
    process.on("SIGTERM", () => {
      onExit();
    });

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
  });
}
