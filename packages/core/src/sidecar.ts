#!/usr/bin/env bun
/**
 * Sidecar entry point for Tauri desktop app
 * 
 * This creates a standalone HTTP server that can be bundled as a binary
 * and spawned by the Tauri shell plugin.
 */
import { startServer } from "./server/index.js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: { type: "string", short: "p" },
    repo: { type: "string", short: "r" },
  },
});

const port = values.port ? parseInt(values.port, 10) : 5050;
const repoPath = values.repo || process.cwd();
// Always bind to 127.0.0.1 for Tauri health checks
const hostname = "127.0.0.1";

console.log(`[sidecar] Starting server on port ${port}`);
console.log(`[sidecar] Repository path: ${repoPath}`);

await startServer({ port, hostname, repoPath });
