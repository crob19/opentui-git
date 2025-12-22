#!/usr/bin/env bun
/**
 * Version bumping script for releases
 * 
 * Usage:
 *   bun run scripts/bump-version.ts --major  # 0.1.0 → 1.0.0
 *   bun run scripts/bump-version.ts --minor  # 0.1.0 → 0.2.0
 *   bun run scripts/bump-version.ts --patch  # 0.1.0 → 0.1.1
 * 
 * Features:
 * - Validates git working directory is clean
 * - Warns if not on main branch
 * - Updates package.json
 * - Creates conventional commit
 * - Creates and pushes git tag
 * - Triggers GitHub Actions for release
 */

import { writeFile } from "fs/promises";
import path from "path";
import { $ } from "bun";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const PACKAGE_JSON = path.join(ROOT_DIR, "package.json");

type BumpType = "major" | "minor" | "patch";

// Parse command line arguments
const args = process.argv.slice(2);
let bumpType: BumpType | null = null;

if (args.includes("--major")) bumpType = "major";
else if (args.includes("--minor")) bumpType = "minor";
else if (args.includes("--patch")) bumpType = "patch";

if (!bumpType) {
  console.error("❌ Error: Missing version bump type");
  console.error("Usage: bun run scripts/bump-version.ts --major|--minor|--patch");
  process.exit(1);
}

// Read current version
const pkg = await Bun.file(PACKAGE_JSON).json();
const currentVersion = pkg.version;
const [major, minor, patch] = currentVersion.split(".").map(Number);

// Calculate new version based on bump type
function calculateNewVersion(type: BumpType): string {
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

const newVersion = calculateNewVersion(bumpType);

console.log(`\n🚀 Release Process Starting...\n`);
console.log(`Version bump: ${currentVersion} → ${newVersion} (${bumpType})`);

// Pre-flight checks
async function checkGitStatus() {
  console.log("\n📋 Running pre-flight checks...");
  
  try {
    const status = await $`git status --porcelain`.text();
    if (status.trim()) {
      console.error("\n❌ Error: Working directory is not clean");
      console.error("Please commit or stash your changes before releasing:");
      console.error(status);
      process.exit(1);
    }
    console.log("   ✓ Working directory is clean");
  } catch (err) {
    console.error("❌ Error checking git status:", err);
    process.exit(1);
  }
}

async function checkBranch() {
  try {
    const branch = (await $`git branch --show-current`.text()).trim();
    if (branch !== "main") {
      console.log(`   ⚠️  Warning: You're on branch '${branch}', not 'main'`);
      
      // Prompt for confirmation
      const answer = prompt("   Continue anyway? (y/N): ");
      if (answer?.toLowerCase() !== "y") {
        console.log("\n❌ Release cancelled");
        process.exit(0);
      }
    } else {
      console.log("   ✓ On main branch");
    }
  } catch (err) {
    console.error("❌ Error checking branch:", err);
    process.exit(1);
  }
}

async function checkRemoteUpToDate() {
  try {
    // Fetch latest from remote
    await $`git fetch origin`.quiet();
    
    const localCommit = (await $`git rev-parse HEAD`.text()).trim();
    const remoteCommit = (await $`git rev-parse origin/main`.text()).trim();
    
    if (localCommit !== remoteCommit) {
      console.log("   ⚠️  Warning: Your local branch is not up to date with origin/main");
      const answer = prompt("   Continue anyway? (y/N): ");
      if (answer?.toLowerCase() !== "y") {
        console.log("\n❌ Release cancelled");
        console.log("   Run: git pull origin main");
        process.exit(0);
      }
    } else {
      console.log("   ✓ Up to date with remote");
    }
  } catch (err) {
    console.log("   ⚠️  Could not check remote status (continuing anyway)");
  }
}

// Update package.json
async function updatePackageJson() {
  console.log("\n📝 Updating package.json...");
  try {
    pkg.version = newVersion;
    await writeFile(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`   ✓ Updated package.json to ${newVersion}`);
  } catch (err) {
    console.error("❌ Error updating package.json:", err);
    process.exit(1);
  }
}

// Commit, tag, and push
async function commitAndTag() {
  console.log("\n📦 Creating release commit and tag...");
  
  try {
    // Stage package.json
    await $`git add package.json`;
    console.log(`   ✓ Staged package.json`);
    
    // Commit with conventional commit format
    await $`git commit -m ${"chore: release v" + newVersion}`;
    console.log(`   ✓ Created commit: "chore: release v${newVersion}"`);
    
    // Create tag
    await $`git tag v${newVersion}`;
    console.log(`   ✓ Created tag v${newVersion}`);
  } catch (err) {
    console.error("❌ Error creating commit/tag:", err);
    process.exit(1);
  }
}

async function pushToRemote() {
  console.log("\n🚢 Pushing to remote...");
  
  try {
    const branch = (await $`git branch --show-current`.text()).trim();
    
    // Push branch
    await $`git push origin ${branch}`;
    console.log(`   ✓ Pushed ${branch} branch`);
    
    // Push tag
    await $`git push origin v${newVersion}`;
    console.log(`   ✓ Pushed tag v${newVersion}`);
  } catch (err) {
    console.error("❌ Error pushing to remote:", err);
    console.error("\nYou may need to push manually:");
    console.error(`  git push origin main`);
    console.error(`  git push origin v${newVersion}`);
    process.exit(1);
  }
}

async function calculateChecksums() {
  console.log("\n🔐 Calculating SHA256 checksums for Homebrew...");
  console.log("   (This will take a moment after GitHub Actions creates the release)\n");
  
  const repoUrl = "https://github.com/crob19/opentui-git";
  
  console.log("   After the release is published, run these commands to get SHA256s:");
  console.log(`   curl -sL ${repoUrl}/releases/download/v${newVersion}/opentui-git-v${newVersion}-darwin-arm64.tar.gz | shasum -a 256`);
  console.log(`   curl -sL ${repoUrl}/releases/download/v${newVersion}/opentui-git-v${newVersion}-darwin-x64.tar.gz | shasum -a 256`);
}

// Main execution
async function main() {
  try {
    // Pre-flight checks
    await checkGitStatus();
    await checkBranch();
    await checkRemoteUpToDate();
    
    // Update version
    await updatePackageJson();
    
    // Create commit and tag
    await commitAndTag();
    
    // Push to remote
    await pushToRemote();
    
    // Success!
    console.log("\n✨ Release v" + newVersion + " complete!\n");
    console.log("🎯 Next steps:");
    console.log(`   1. GitHub Actions is building the release: ${pkg.homepage}/actions`);
    console.log(`   2. Release will be published at: ${pkg.homepage}/releases/tag/v${newVersion}`);
    console.log(`   3. Update Homebrew formula with new SHA256s (see below)\n`);
    
    await calculateChecksums();
    
  } catch (err) {
    console.error("\n❌ Release failed:", err);
    process.exit(1);
  }
}

main();
