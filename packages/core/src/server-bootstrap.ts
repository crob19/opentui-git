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

async function readReadyLine(
  stdout: ReadableStream<Uint8Array>,
): Promise<{ line: ServerReadyLine; leftover: string }> {
  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        const rest = buffer.slice(idx + 1);
        if (!line) {
          buffer = rest;
          continue;
        }
        try {
          const parsed = JSON.parse(line);
          if (
            parsed &&
            parsed.type === "ready" &&
            typeof parsed.url === "string"
          ) {
            return { line: parsed as ServerReadyLine, leftover: rest };
          }
        } catch {
          // Non-JSON output (logs); ignore.
        }
        buffer = rest;
      }
    }
    throw new Error("Server exited before emitting a ready line");
  } finally {
    reader.releaseLock();
  }
}

// Forward any further bytes from `stdout` to the parent's stdout so the
// child's pipe doesn't backpressure after the ready line. Started detached;
// errors after dispose are expected.
function drainStdout(
  stdout: ReadableStream<Uint8Array>,
  initial: string,
): void {
  if (initial) process.stdout.write(initial);
  void (async () => {
    const reader = stdout.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) process.stdout.write(value);
      }
    } catch {
      // Stream closed during teardown.
    } finally {
      reader.releaseLock();
    }
  })();
}

/**
 * Resolve the GraphQL endpoint the TUI should talk to.
 * - Honors `OPENTUI_GIT_SERVER_URL` (skips spawn — useful for Electron-style multi-client dev).
 * - Otherwise spawns `@opentui-git/server` and waits for its ready line.
 */
export async function bootstrapServer(cwd: string): Promise<BootstrapResult> {
  const externalUrl = process.env.OPENTUI_GIT_SERVER_URL;
  if (externalUrl) {
    logger.debug("[server-bootstrap] using external server", externalUrl);
    return { url: externalUrl, dispose: async () => {} };
  }

  // Resolve the sibling server package via import.meta.url instead of
  // require.resolve so core does not need to declare server as a dependency
  // (avoids a workspace dependency cycle: server already depends on core).
  const serverEntry = fileURLToPath(
    new URL("../../server/src/index.ts", import.meta.url),
  );
  logger.debug("[server-bootstrap] spawning server", serverEntry, "cwd:", cwd);

  const proc = Bun.spawn(["bun", "run", serverEntry, "--cwd", cwd], {
    stdout: "pipe",
    stderr: "inherit",
    env: { ...process.env, PORT: process.env.PORT ?? "0" },
  });

  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    try {
      proc.kill();
      await proc.exited;
    } catch (error) {
      logger.warn("[server-bootstrap] failed to kill server:", error);
    }
  };

  const onSignal = () => {
    void dispose();
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  void proc.exited.then(() => {
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
    const result = await Promise.race([readReadyLine(proc.stdout), timeout]);
    line = result.line;
    leftover = result.leftover;
  } catch (error) {
    await dispose();
    throw error;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  // Keep the child's pipe drained so it doesn't block on subsequent writes.
  drainStdout(proc.stdout, leftover);

  return { url: line.url, dispose };
}
