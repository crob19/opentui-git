#!/usr/bin/env bun
import solidTransformPlugin from "@opentui/solid/bun-plugin";

// Build the application using Bun's bundler with the Solid plugin
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  plugins: [solidTransformPlugin],
  // Don't bundle node_modules to keep the build fast
  external: [
    "@opentui/*",
    "@opentui-git/*",
    "@elysiajs/*",
    "solid-js",
    "simple-git",
    "shiki",
    "diff",
    "elysia",
  ],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build successful!");
console.log(`Built ${result.outputs.length} file(s) to ./dist`);
