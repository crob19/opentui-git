#!/usr/bin/env node
/**
 * opentui-git launcher.
 *
 * The TUI uses @opentui/core, which loads its native renderer via `bun:ffi`
 * and therefore can only run under the Bun runtime. The npm package ships
 * raw TS sources; this launcher re-execs them under `bun`. If Bun isn't
 * installed, we print install instructions and exit 127.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(here, "..", "src", "index.ts");

const child = spawn(
  "bun",
  ["run", "--conditions=browser", entry, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

child.on("error", (err) => {
  if (err && err.code === "ENOENT") {
    console.error("opentui-git requires Bun (https://bun.sh).");
    console.error("Install:  curl -fsSL https://bun.sh/install | bash");
    process.exit(127);
  }
  console.error("Failed to launch bun:", err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
