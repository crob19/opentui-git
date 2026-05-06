#!/usr/bin/env node
/**
 * Version bumping script for releases.
 *
 * Usage:
 *   pnpm release:patch  # 0.1.0 → 0.1.1
 *   pnpm release:minor  # 0.1.0 → 0.2.0
 *   pnpm release:major  # 0.1.0 → 1.0.0
 *
 * Bumps packages/core/package.json (the published package), commits, tags,
 * and pushes. The release.yml workflow takes over from the tag push and
 * publishes to npm.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(__dirname, "..");
const PACKAGE_JSON = path.join(PKG_DIR, "package.json");

type BumpType = "major" | "minor" | "patch";

const args = process.argv.slice(2);
let bumpType: BumpType | null = null;
if (args.includes("--major")) bumpType = "major";
else if (args.includes("--minor")) bumpType = "minor";
else if (args.includes("--patch")) bumpType = "patch";

if (!bumpType) {
  console.error("Error: missing version bump type");
  console.error(
    "Usage: tsx packages/core/scripts/bump-version.ts --major|--minor|--patch",
  );
  process.exit(1);
}

let pkg: Record<string, unknown>;
try {
  pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
} catch (err) {
  console.error("Error: failed to read or parse", PACKAGE_JSON);
  console.error(err);
  process.exit(1);
}

const currentVersion = String(pkg.version || "");
if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
  console.error(`Error: invalid version in package.json: "${currentVersion}"`);
  process.exit(1);
}
const [major, minor, patch] = currentVersion.split(".").map(Number);

function calc(t: BumpType): string {
  switch (t) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}
const newVersion = calc(bumpType);

console.log(`\nRelease ${currentVersion} → ${newVersion} (${bumpType})\n`);

function git(...gitArgs: string[]): string {
  return execFileSync("git", gitArgs, { encoding: "utf8" }).trim();
}

console.log("Pre-flight checks:");

const status = git("status", "--porcelain");
if (status) {
  console.error("\nError: working directory is not clean");
  console.error(status);
  process.exit(1);
}
console.log("  ✓ Working directory clean");

const branch = git("branch", "--show-current");
if (branch !== "main") {
  console.error(`\nError: must be on 'main' branch (currently '${branch}')`);
  process.exit(1);
}
console.log("  ✓ On main branch");

git("fetch", "origin");
const local = git("rev-parse", "HEAD");
const remote = git("rev-parse", "origin/main");
if (local !== remote) {
  console.error("\nError: local main is not up to date with origin/main");
  process.exit(1);
}
console.log("  ✓ Up to date with remote");

console.log("\nUpdating package.json:");
pkg.version = newVersion;
writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
console.log(`  ✓ Wrote ${newVersion}`);

console.log("\nCommit & tag:");
git("add", PACKAGE_JSON);
git("commit", "-m", `chore: release v${newVersion}`);
git("tag", "-a", `v${newVersion}`, "-m", `chore: release v${newVersion}`);
console.log(`  ✓ Tagged v${newVersion}`);

console.log("\nPushing:");
git("push", "origin", "main");
git("push", "origin", `v${newVersion}`);
console.log(`  ✓ Pushed main and v${newVersion}`);

console.log(
  `\nRelease v${newVersion} pushed. The release workflow will publish to npm.\n`,
);
