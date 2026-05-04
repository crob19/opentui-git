import { logger } from "./tui/utils/logger.js";

export interface BootstrapResult {
  /** Base URL of the GraphQL server (no trailing /graphql). */
  url: string;
  /** Tear down the spawned server (no-op when an external URL was used). */
  dispose: () => void;
}

interface ServerReadyLine {
  type: "ready";
  url: string;
  cwd: string;
}

const READY_TIMEOUT_MS = 10_000;

async function readReadyLine(
  stdout: ReadableStream<Uint8Array>,
): Promise<ServerReadyLine> {
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
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (
            parsed &&
            parsed.type === "ready" &&
            typeof parsed.url === "string"
          ) {
            return parsed as ServerReadyLine;
          }
        } catch {
          // Non-JSON output (logs); ignore.
        }
      }
    }
    throw new Error("Server exited before emitting a ready line");
  } finally {
    reader.releaseLock();
  }
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
    return { url: externalUrl, dispose: () => {} };
  }

  const serverEntry = require.resolve("@opentui-git/server/src/index.ts");
  logger.debug("[server-bootstrap] spawning server", serverEntry, "cwd:", cwd);

  const proc = Bun.spawn(["bun", "run", serverEntry, "--cwd", cwd], {
    stdout: "pipe",
    stderr: "inherit",
    env: { ...process.env, PORT: process.env.PORT ?? "0" },
  });

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try {
      proc.kill();
    } catch (error) {
      logger.warn("[server-bootstrap] failed to kill server:", error);
    }
  };

  const ready = readReadyLine(proc.stdout);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(`Server did not become ready within ${READY_TIMEOUT_MS}ms`),
        ),
      READY_TIMEOUT_MS,
    ),
  );

  let line: ServerReadyLine;
  try {
    line = await Promise.race([ready, timeout]);
  } catch (error) {
    dispose();
    throw error;
  }

  return { url: line.url, dispose };
}
