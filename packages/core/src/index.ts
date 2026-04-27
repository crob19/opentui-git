#!/usr/bin/env bun
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
  console.log(
    "A lazygit-style terminal UI git client built with OpenTUI, SolidJS, and Bun",
  );
  console.log();
  console.log("Usage: opentui-git [options]");
  console.log();
  console.log("Options:");
  console.log("  -v, --version    Show version number");
  console.log("  -h, --help       Show this help message");
  process.exit(0);
}

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

const { startTUI } = await import("./tui/index.js");
await startTUI({ repoPath });
