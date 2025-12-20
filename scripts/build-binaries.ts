#!/usr/bin/env bun
/**
 * Build script for creating standalone binaries for macOS
 *
 * Uses Bun.build() API with the @opentui/solid plugin to properly
 * transform JSX before compilation.
 *
 * Usage:
 *   bun run build:binary              # Build for current platform
 *   bun run build:binary --arch arm64 # Build for specific architecture
 *   bun run build:binary --arch x64   # Build for specific architecture
 */

import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import solidPlugin from "@opentui/solid/bun-plugin";

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const ENTRY_FILE = path.join(ROOT_DIR, "src/index.tsx");

// Get version from package.json
const pkg = await Bun.file(path.join(ROOT_DIR, "package.json")).json();
const VERSION = pkg.version;
const NAME = pkg.name;

// Parse command line arguments
function getTargetArch(): string {
  const archIndex = process.argv.indexOf("--arch");
  if (archIndex !== -1 && process.argv[archIndex + 1]) {
    return process.argv[archIndex + 1];
  }
  return process.arch; // Default to current architecture
}

const TARGET_ARCH = getTargetArch();
const PLATFORM = "darwin";

async function clean() {
  console.log("Cleaning dist directory...");
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true });
  }
  await mkdir(DIST_DIR, { recursive: true });
}

async function bundleSource(): Promise<string> {
  const bundlePath = path.join(DIST_DIR, "bundle.js");

  console.log("Bundling source with solidPlugin...");

  const result = await Bun.build({
    entrypoints: [ENTRY_FILE],
    outdir: DIST_DIR,
    naming: "bundle.js",
    target: "bun",
    plugins: [solidPlugin],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  if (!result.success) {
    console.error("Bundle failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log(`  Created bundle: ${bundlePath}`);
  return bundlePath;
}

async function compileBinary(bundlePath: string): Promise<string> {
  const bunTarget = `bun-${PLATFORM}-${TARGET_ARCH}`;
  const outputName = `${NAME}-${PLATFORM}-${TARGET_ARCH}`;
  const outputPath = path.join(DIST_DIR, outputName);

  console.log(`\nCompiling binary: ${outputName}`);
  console.log(`  Target: ${bunTarget}`);

  // Use bun build CLI for compilation since Bun.build() compile option
  // doesn't support cross-compilation targets well
  const proc = Bun.spawn(
    ["bun", "build", bundlePath, "--compile", `--target=${bunTarget}`, `--outfile=${outputPath}`],
    {
      cwd: ROOT_DIR,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.error("Compile failed:", stderr);
    process.exit(1);
  }

  console.log(`  Created: ${outputPath}`);

  // Clean up bundle
  if (existsSync(bundlePath)) {
    await rm(bundlePath);
  }

  return outputPath;
}

async function createTarball(binaryPath: string) {
  const binaryName = path.basename(binaryPath);
  const tarballName = `${NAME}-v${VERSION}-${PLATFORM}-${TARGET_ARCH}.tar.gz`;
  const tarballPath = path.join(DIST_DIR, tarballName);

  console.log(`\nCreating tarball: ${tarballName}`);

  const proc = Bun.spawn(["tar", "-czvf", tarballPath, "-C", DIST_DIR, binaryName], {
    stdout: "pipe",
    stderr: "pipe",
  });

  await proc.exited;

  if (proc.exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.error("Failed to create tarball:", stderr);
    process.exit(1);
  }

  console.log(`  Created: ${tarballPath}`);
  return tarballPath;
}

async function main() {
  console.log(`\nBuilding ${NAME} v${VERSION}`);
  console.log(`Platform: ${PLATFORM}, Architecture: ${TARGET_ARCH}\n`);

  await clean();

  // Step 1: Bundle with solidPlugin to transform JSX
  const bundlePath = await bundleSource();

  // Step 2: Compile the bundle to a standalone binary
  const binaryPath = await compileBinary(bundlePath);

  // Step 3: Create tarball for distribution
  await createTarball(binaryPath);

  console.log("\nBuild complete!");
  console.log(`\nBinaries are in: ${DIST_DIR}`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
