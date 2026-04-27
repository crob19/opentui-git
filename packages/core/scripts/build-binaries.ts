#!/usr/bin/env bun
/**
 * Compile the TUI to a standalone executable via `bun build --compile`.
 *
 * Usage: bun run build:binary --arch arm64|x64
 *
 * Output:
 *   dist/opentui-git-darwin-{arch}                   (executable)
 *   dist/opentui-git-v{version}-darwin-{arch}.tar.gz (release artifact)
 */

import path from "path";
import { mkdir, rm } from "fs/promises";
import { $ } from "bun";
import solidTransformPlugin from "@opentui/solid/bun-plugin";

const args = process.argv.slice(2);
const archIdx = args.indexOf("--arch");
const arch = archIdx !== -1 ? args[archIdx + 1] : null;

if (arch !== "arm64" && arch !== "x64") {
  console.error("Usage: bun run build:binary --arch arm64|x64");
  process.exit(1);
}

const ROOT_DIR = path.resolve(import.meta.dir, "..");
const PKG = await Bun.file(path.join(ROOT_DIR, "package.json")).json();
const version = PKG.version as string;

const target = arch === "arm64" ? "bun-darwin-arm64" : "bun-darwin-x64";
const binName = `opentui-git-darwin-${arch}`;
const tarName = `opentui-git-v${version}-darwin-${arch}.tar.gz`;

const distDir = path.join(ROOT_DIR, "dist");
await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

console.log(`Compiling ${binName} (target: ${target})...`);

const result = await Bun.build({
  entrypoints: [path.join(ROOT_DIR, "src/index.ts")],
  outdir: distDir,
  target: "bun",
  plugins: [solidTransformPlugin],
  compile: {
    target,
    outfile: path.join(distDir, binName),
  },
  conditions: ["browser"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log(`Packaging ${tarName}...`);
await $`tar -czf ${path.join(distDir, tarName)} -C ${distDir} ${binName}`;

console.log(`Done: dist/${tarName}`);
