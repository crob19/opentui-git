#!/usr/bin/env bun
/**
 * Entry point for opentui-git CLI
 * Handles CLI flags and then delegates to the appropriate command
 */

import { getFullVersionString } from "./utils/version.js";

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
  console.log("Usage: opentui-git [command] [options]");
  console.log();
  console.log("Commands:");
  console.log("  (default)        Start the TUI (connects to or starts server)");
  console.log("  serve            Start headless server only");
  console.log("  attach <url>     Connect TUI to existing server");
  console.log();
  console.log("Options:");
  console.log("  -v, --version    Show version number");
  console.log("  -h, --help       Show this help message");
  console.log("  --port <port>    Server port (default: 4096)");
  process.exit(0);
}

// Determine command
const command = args[0];

if (command === "serve") {
  // Start headless server
  const { startServer } = await import("./server/index.js");
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 4096;
  await startServer({ port });
} else if (command === "attach") {
  // Connect TUI to existing server
  const url = args[1];
  if (!url) {
    console.error("Error: attach command requires a URL");
    console.error("Usage: opentui-git attach <url>");
    process.exit(1);
  }
  const { startTUI } = await import("./tui/index.js");
  await startTUI({ serverUrl: url });
} else {
  // Default: start both server and TUI
  const { startTUI } = await import("./tui/index.js");
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 4096;
  await startTUI({ port });
}
