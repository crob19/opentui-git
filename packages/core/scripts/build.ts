/**
 * Build step for the published opentui-git npm artifact.
 *
 * The TUI runs under Bun (because @opentui/core uses bun:ffi), and Bun
 * executes TypeScript directly — so there's nothing to bundle. We only need
 * to vendor the GraphQL server's source into this package so that, once
 * published, the bin launcher (`bin/opentui-git.mjs`) can find it without a
 * separate workspace package.
 *
 * Output:
 *   dist/server-src/  Server TS source, copied verbatim from packages/server.
 */

import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PKG_DIR, "../..");
const SERVER_SRC = path.join(REPO_ROOT, "packages/server/src");
const DIST = path.join(PKG_DIR, "dist");

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

console.log("Copying server source → dist/server-src/ …");
cpSync(SERVER_SRC, path.join(DIST, "server-src"), { recursive: true });

// README and LICENSE live at the repo root; npm only includes files inside
// the package directory, so vendor them in for the published artifact.
console.log("Copying README.md and LICENSE …");
copyFileSync(
  path.join(REPO_ROOT, "README.md"),
  path.join(PKG_DIR, "README.md"),
);
copyFileSync(path.join(REPO_ROOT, "LICENSE"), path.join(PKG_DIR, "LICENSE"));

console.log("Build complete.");
