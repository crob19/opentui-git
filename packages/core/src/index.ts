#!/usr/bin/env bun
import { getFullVersionString } from "./tui/utils/version.js";
import { logger } from "./tui/utils/logger.js";
import { bootstrapServer } from "./server-bootstrap.js";
import { createClient, RepoInfoDocument } from "@opentui-git/client";
import { runQuery } from "./tui/data/operations.js";

const args = process.argv.slice(2);

if (args.includes("--version") || args.includes("-v")) {
  console.log(getFullVersionString());
  process.exit(0);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(getFullVersionString());
  console.log();
  console.log(
    "A lazygit-style terminal UI git client built with OpenTUI, SolidJS, and Bun",
  );
  console.log();
  console.log("Usage: opentui-git [options]");
  console.log();
  console.log("Options:");
  console.log("  -v, --version    Show version number");
  console.log("  -h, --help       Show this help message");
  console.log();
  console.log("Environment:");
  console.log(
    "  OPENTUI_GIT_SERVER_URL  Connect to an existing GraphQL server instead of spawning one.",
  );
  process.exit(0);
}

const { url, dispose } = await bootstrapServer(process.cwd());
logger.debug("[index] GraphQL endpoint:", url);

const client = createClient({ endpoint: url });

const { repoInfo } = await runQuery(client, RepoInfoDocument);
const { isRepo, repoRoot } = repoInfo;
const repoPath = isRepo && repoRoot ? repoRoot : process.cwd();
if (!isRepo) {
  logger.warn("[index] Not in a git repository, using cwd:", process.cwd());
}

const { startTUI } = await import("./tui/index.js");
try {
  await startTUI({ repoPath, client });
} finally {
  dispose();
}
