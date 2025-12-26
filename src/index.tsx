#!/usr/bin/env bun
import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";
import { getFullVersionString } from "./utils/version.js";

/**
 * Entry point for opentui-git
 * Initializes the OpenTUI renderer and starts the application
 */

// Global shutdown registry
// Allows components to register cleanup handlers that run before process exit
const shutdownHandlers: (() => void)[] = [];

/**
 * Register a cleanup handler to be called during shutdown
 * @param handler - Function to execute during shutdown
 */
export function registerShutdownHandler(handler: () => void) {
  shutdownHandlers.push(handler);
}

/**
 * Execute all registered shutdown handlers and exit the process
 * This ensures consistent cleanup whether exiting via keyboard (q/Ctrl+C) or signals (SIGTERM)
 */
export function executeShutdown() {
  console.log("Executing shutdown handlers...");
  
  // Execute all registered handlers
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

// Handle CLI flags before rendering
const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(getFullVersionString());
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(getFullVersionString());
  console.log();
  console.log("A lazygit-style terminal UI git client built with OpenTUI, SolidJS, and Bun");
  console.log();
  console.log("Usage: opentui-git [options]");
  console.log();
  console.log("Options:");
  console.log("  -v, --version    Show version number");
  console.log("  -h, --help       Show this help message");
  process.exit(0);
}

// Handle system termination signal (SIGTERM)
// Now uses the same graceful shutdown as keyboard handlers (q/Ctrl+C)
process.on("SIGTERM", () => {
  executeShutdown();
});

// Render the app with console overlay configuration
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
