#!/usr/bin/env node
// Mirror every src/**/*.graphql file into dist/ so the runtime glob in
// schema/index.ts (which uses import.meta.url) finds them next to the
// emitted JS.
import { readdir, mkdir, copyFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");
const distDir = join(here, "..", "dist");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let count = 0;
for await (const file of walk(srcDir)) {
  if (!file.endsWith(".graphql")) continue;
  const rel = relative(srcDir, file);
  const dest = join(distDir, rel);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(file, dest);
  count++;
}
console.log(`✓ copied ${count} .graphql file(s) to dist/`);
