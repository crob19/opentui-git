#!/usr/bin/env bun
/**
 * Pre-dev script for Tauri development
 * 
 * Ensures the sidecar binary exists before running Tauri dev mode.
 * Builds the sidecar for the current platform if it doesn't exist.
 */
import { existsSync } from "node:fs";
import { $ } from "bun";
import path from "node:path";

// Determine target for current platform
function getTarget(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "darwin") {
    return arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin";
  } else if (platform === "win32") {
    return "x86_64-pc-windows-msvc";
  } else {
    return "x86_64-unknown-linux-gnu";
  }
}

const target = getTarget();
const ext = process.platform === "win32" ? ".exe" : "";
const binaryName = `opentui-git-server-${target}${ext}`;
const sidecarPath = path.resolve(import.meta.dir, `../src-tauri/sidecars/${binaryName}`);

console.log(`Checking for sidecar: ${binaryName}`);

if (!existsSync(sidecarPath)) {
  console.log("Sidecar not found, building...");
  
  try {
    // Build the sidecar from the core package
    await $`bun run --cwd ../core build:sidecar ${target}`;
    console.log("Sidecar build complete");
  } catch (error) {
    console.error("Failed to build sidecar:", error);
    process.exit(1);
  }
} else {
  console.log("Sidecar already exists");
}

console.log("Pre-dev setup complete");
