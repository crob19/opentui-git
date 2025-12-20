import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";

/**
 * Entry point for opentui-git
 * Initializes the OpenTUI renderer and starts the application
 */

// Handle graceful shutdown
process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
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
      onCopySelection: async (text) => {
        try {
          await Clipboard.copy(text);
          console.log(`Copied ${text.length} characters to clipboard`);
        } catch (err) {
          console.error("Copy failed:", err);
        }
      },
    },
  }
);
