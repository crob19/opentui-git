#!/usr/bin/env bun
/**
 * Build script for creating sidecar binaries for Tauri
 * 
 * Usage:
 *   bun run scripts/build-sidecar.ts [target]
 * 
 * Targets:
 *   - aarch64-apple-darwin (Apple Silicon Mac)
 *   - x86_64-apple-darwin (Intel Mac)
 *   - x86_64-pc-windows-msvc (Windows)
 *   - x86_64-unknown-linux-gnu (Linux)
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Map Tauri target names to Bun target names
const targetMapping: Record<string, string> = {
  "aarch64-apple-darwin": "bun-darwin-arm64",
  "x86_64-apple-darwin": "bun-darwin-x64",
  "x86_64-pc-windows-msvc": "bun-windows-x64",
  "x86_64-unknown-linux-gnu": "bun-linux-x64",
};

const outputNames: Record<string, string> = {
  "aarch64-apple-darwin": "opentui-git-server-aarch64-apple-darwin",
  "x86_64-apple-darwin": "opentui-git-server-x86_64-apple-darwin",
  "x86_64-pc-windows-msvc": "opentui-git-server-x86_64-pc-windows-msvc.exe",
  "x86_64-unknown-linux-gnu": "opentui-git-server-x86_64-unknown-linux-gnu",
};

// Determine default target based on current platform
function getDefaultTarget(): string {
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

const tauriTarget = process.argv[2] || getDefaultTarget();
const bunTarget = targetMapping[tauriTarget];
const binaryName = outputNames[tauriTarget];

if (!bunTarget || !binaryName) {
  console.error(`Unknown target: ${tauriTarget}`);
  console.error(`Available targets: ${Object.keys(targetMapping).join(", ")}`);
  process.exit(1);
}

const sidecarsDir = path.resolve(import.meta.dir, "../../desktop/src-tauri/sidecars");
const outputPath = path.join(sidecarsDir, binaryName);

console.log(`Building sidecar for target: ${tauriTarget}`);
console.log(`Bun target: ${bunTarget}`);
console.log(`Output: ${outputPath}`);

// Ensure sidecars directory exists
if (!existsSync(sidecarsDir)) {
  await mkdir(sidecarsDir, { recursive: true });
  console.log(`Created directory: ${sidecarsDir}`);
}

// Build the sidecar binary using Bun.build() API
// This allows us to disable bunfig autoloading
const srcPath = path.resolve(import.meta.dir, "../src/sidecar.ts");

try {
  const result = await Bun.build({
    entrypoints: [srcPath],
    target: "bun",
    minify: true,
    compile: {
      // Disable autoloading of bunfig.toml to avoid @opentui/solid/preload
      autoloadBunfig: false,
      // Disable dotenv autoloading
      autoloadDotenv: false,
      // @ts-ignore - newer Bun API options
      autoloadTsconfig: true,
      autoloadPackageJson: true,
      // Use Bun target format for cross-compilation
      target: bunTarget as any,
      outfile: outputPath,
    },
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log(`Successfully built: ${outputPath}`);
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
