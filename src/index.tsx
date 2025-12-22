#!/usr/bin/env bun
import { render } from "@opentui/solid";
import { App } from "./app.js";
import { Clipboard } from "./utils/clipboard.js";
import packageJson from "../package.json" with { type: "json" };

/**
 * Entry point for opentui-git
 * Initializes the OpenTUI renderer and starts the application
 */

// Handle CLI flags before rendering
const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(`opentui-git v${packageJson.version}`);
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`opentui-git v${packageJson.version}`);
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
      onCopySelection: (text) => {
        Clipboard.copy(text)
          .then(() => console.log(`Copied ${text.length} characters to clipboard`))
          .catch((err) => console.error("Copy failed:", err));
      },
    },
  }
);
