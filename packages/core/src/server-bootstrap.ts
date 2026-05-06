import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { logger } from "./tui/utils/logger.js";

export interface BootstrapResult {
  /** Base URL of the GraphQL server (no trailing /graphql). */
  url: string;
  /** Tear down the spawned server (no-op when an external URL was used). */
  dispose: () => Promise<void>;
}

interface ServerReadyLine {
  type: "ready";
  url: string;
  cwd: string;
}

const READY_TIMEOUT_MS = 10_000;

function readReadyLine(
  proc: ChildProcess,
): Promise<{ line: ServerReadyLine; leftover: string }> {
  return new Promise((resolve, reject) => {
    if (!proc.stdout) {
      reject(new Error("Server child process has no stdout pipe"));
      return;
    }

    let buffer = "";
    let settled = false;

    const onData = (chunk: Buffer | string) => {
      if (settled) return;
      buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (
            parsed &&
            parsed.type === "ready" &&
            typeof parsed.url === "string"
          ) {
            settled = true;
            proc.stdout!.off("data", onData);
            proc.off("exit", onExit);
            resolve({ line: parsed as ServerReadyLine, leftover: buffer });
            return;
          }
        } catch {
          // Non-JSON output (logs); ignore.
        }
      }
    };

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      proc.stdout!.off("data", onData);
      reject(
        new Error(
          `Server exited before emitting a ready line (code=${code} signal=${signal})`,
        ),
      );
    };

    proc.stdout.on("data", onData);
    proc.once("exit", onExit);
  });
}

function drainStdout(proc: ChildProcess, initial: string): void {
  if (initial) process.stdout.write(initial);
  proc.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
}

/**
 * Resolve the GraphQL endpoint the TUI should talk to.
 * - Honors `OPENTUI_GIT_SERVER_URL` (skips spawn — useful for Electron-style multi-client dev).
 * - Otherwise spawns the GraphQL server child process via tsx and waits for
 *   its ready line. Detects published (sibling `dist/server-src/index.ts`
 *   bundled into the npm package) vs. dev (TS source at
 *   `packages/server/src/index.ts`).
 */
export async function bootstrapServer(cwd: string): Promise<BootstrapResult> {
  const externalUrl = process.env.OPENTUI_GIT_SERVER_URL;
  if (externalUrl) {
    logger.debug("[server-bootstrap] using external server", externalUrl);
    return { url: externalUrl, dispose: async () => {} };
  }

  const publishedEntry = fileURLToPath(
    new URL("./server-src/index.ts", import.meta.url),
  );
  const isPublished = existsSync(publishedEntry);
  const serverEntry = isPublished
    ? publishedEntry
    : fileURLToPath(new URL("../../server/src/index.ts", import.meta.url));

  logger.debug(
    "[server-bootstrap] spawning server",
    serverEntry,
    "cwd:",
    cwd,
    "mode:",
    isPublished ? "published" : "dev",
  );

  // The TUI runs under Bun (required by @opentui/core's FFI), so the parent
  // process already has Bun available. The server is plain TS — let Bun run
  // it directly to keep both halves on one runtime.
  const proc = spawn("bun", ["run", serverEntry, "--cwd", cwd], {
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, PORT: process.env.PORT ?? "0" },
  });

  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    if (proc.killed || proc.exitCode !== null) return;
    proc.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      if (proc.exitCode !== null) {
        resolve();
        return;
      }
      proc.once("exit", () => resolve());
    });
  };

  const onSignal = () => {
    void dispose();
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  proc.once("exit", () => {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  });

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () =>
        reject(
          new Error(`Server did not become ready within ${READY_TIMEOUT_MS}ms`),
        ),
      READY_TIMEOUT_MS,
    );
  });

  let line: ServerReadyLine;
  let leftover: string;
  try {
    const result = await Promise.race([readReadyLine(proc), timeout]);
    line = result.line;
    leftover = result.leftover;
  } catch (error) {
    await dispose();
    throw error;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  drainStdout(proc, leftover);

  return { url: line.url, dispose };
}
