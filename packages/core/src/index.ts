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

// Log startup info
logger.debug("[index] ========== STARTUP ==========");
logger.debug("[index] CWD:", process.cwd());
logger.debug("[index] Script URL:", import.meta.url);
logger.debug("[index] Args:", args);
logger.debug("[index] Bun version:", Bun.version);
logger.debug("[index] Process ID:", process.pid);

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
logger.debug("[index] Command:", command || "(default)");

if (command === "serve") {
  // Start headless server - import and run directly
  logger.debug("[index] Starting headless server mode");
  
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 5050;
  logger.debug("[index] Server port:", port);
  
  // Find the git repository root
  logger.debug("[index] Finding git repository root...");
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
  logger.debug("[index] Starting attach mode (TUI only)");
  const url = args[1];
  if (!url) {
    console.error("Error: attach command requires a URL");
    console.error("Usage: opentui-git attach <url>");
    process.exit(1);
  }
  logger.debug("[index] Server URL:", url);
  
  // Dynamically import TUI module - this is the only import in attach mode
  logger.debug("[index] Importing TUI module...");
  const { startTUI } = await import("./tui/index.js");
  logger.debug("[index] TUI module imported, starting TUI...");
  await startTUI({ serverUrl: url });
  
} else {
  // Default: start server in-process, spawn TUI as subprocess
  // This matches OpenCode's architecture where:
  // 1. Server runs in main process (doesn't use solid-js)
  // 2. TUI runs in clean subprocess (only loads TUI code)
  logger.debug("[index] Starting default mode (server + TUI subprocess)");
  
  const portIndex = args.indexOf("--port");
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 5050;
  const serverUrl = `http://localhost:${port}`;
  logger.debug("[index] Server port:", port);
  logger.debug("[index] Server URL:", serverUrl);
  
  // Find the git repository root
  // We need to go up from packages/core to the actual repo root
  logger.debug("[index] Finding git repository root...");
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
  
  // Start server in this process with the correct repo path
  logger.debug("[index] Starting server in main process...");
  const { startServer } = await import("./server/index.js");
  const server = await startServer({ port, repoPath });
  logger.debug("[index] Server started successfully");
  
  // Spawn TUI as a separate process using the "attach" command
  // This ensures TUI runs in a clean environment without server imports
  const scriptPath = new URL(import.meta.url).pathname;
  const cwd = new URL("../", import.meta.url).pathname;
  
  logger.debug("[index] Spawning TUI subprocess...");
  logger.debug("[index] Script path:", scriptPath);
  logger.debug("[index] Subprocess CWD:", cwd);
  logger.debug("[index] Exec path:", process.execPath);
  
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
  
  logger.debug("[index] TUI subprocess spawned, PID:", tuiProc.pid);
  
  // Wait for TUI to exit
  await tuiProc.exited;
  logger.debug("[index] TUI subprocess exited");
  
  // Stop server when TUI exits
  logger.debug("[index] Stopping server...");
  server.stop();
  logger.debug("[index] Server stopped, exiting");
  process.exit(0);
}
