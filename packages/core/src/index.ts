#!/usr/bin/env bun
/**
 * Entry point for opentui-git CLI
 * 
 * Architecture (matching OpenCode's pattern):
 * - "serve" command: starts server directly (no TUI)
 * - "attach" command: starts TUI only, connects to existing server
 * - default command: starts server in-process, spawns TUI as subprocess
 * 
 * This ensures the TUI runs in a clean process without any server imports.
 */

import { getFullVersionString } from "./tui/utils/version.js";
import { logger } from "./tui/utils/logger.js";

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
  console.log("  (default)        Start the TUI (starts server and connects)");
  console.log("  serve            Start headless server only");
  console.log("  attach <url>     Connect TUI to existing server");
  console.log();
  console.log("Options:");
  console.log("  -v, --version    Show version number");
  console.log("  -h, --help       Show this help message");
  console.log("  --port <port>    Server port (default: 5050)");
  process.exit(0);
}

// Determine command
const command = args[0];

if (command === "serve") {
  // Start headless server - import and run directly
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 5050;
  
  // Find the git repository root
  const simpleGit = (await import("simple-git")).default;
  const git = simpleGit(process.cwd());
  let repoPath: string;
  try {
    repoPath = (await git.revparse(["--show-toplevel"])).trim();
    logger.debug("[index] Git repo root found:", repoPath);
  } catch (error) {
    logger.warn("[index] Not in a git repository, using cwd:", process.cwd());
    repoPath = process.cwd();
  }
  
  const { startServer } = await import("./server/index.js");
  await startServer({ port, repoPath });
  
} else if (command === "attach") {
  // Connect TUI to existing server
  // This command should ONLY load TUI code, never server code
  const url = args[1];
  if (!url) {
    console.error("Error: attach command requires a URL");
    console.error("Usage: opentui-git attach <url>");
    process.exit(1);
  }
  
  // Dynamically import TUI module - this is the only import in attach mode
  const { startTUI } = await import("./tui/index.js");
  await startTUI({ serverUrl: url });
  
} else {
  // Default: start server in-process, spawn TUI as subprocess
  // This matches OpenCode's architecture where:
  // 1. Server runs in main process (doesn't use solid-js)
  // 2. TUI runs in clean subprocess (only loads TUI code)
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 5050;
  const serverUrl = `http://localhost:${port}`;
  
  // Find the git repository root
  // We need to go up from packages/core to the actual repo root
  const simpleGit = (await import("simple-git")).default;
  const git = simpleGit(process.cwd());
  let repoPath: string;
  try {
    repoPath = (await git.revparse(["--show-toplevel"])).trim();
  } catch (error) {
    repoPath = process.cwd();
  }
  
  // Start server in this process with the correct repo path
  const { startServer } = await import("./server/index.js");
  const server = await startServer({ port, repoPath });
  
  // Spawn TUI as a separate process using the "attach" command
  // This ensures TUI runs in a clean environment without server imports
  const scriptPath = new URL(import.meta.url).pathname;
  const cwd = new URL("../", import.meta.url).pathname;
  
  const tuiProc = Bun.spawn({
    cmd: [
      process.execPath,
      "run",
      "--conditions",
      "browser",
      scriptPath,
      "attach",
      serverUrl,
    ],
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: {
      ...process.env,
      // Clear any cached options
      BUN_OPTIONS: "",
    },
  });
  
  // Wait for TUI to exit
  await tuiProc.exited;
  
  // Stop server when TUI exits
  server.stop();
  process.exit(0);
}
