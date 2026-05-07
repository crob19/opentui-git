import { spawn, type ChildProcess } from "node:child_process";

export interface SpawnedServer {
  url: string;
  child: ChildProcess;
}

export interface SpawnOptions {
  serverPackageDir: string;
  repoCwd: string;
  /** ms before we give up waiting for the ready line */
  readyTimeoutMs?: number;
}

/**
 * Spawn the GraphQL server as a child process and resolve once it emits
 * `{"type":"ready","url":"..."}` on stdout. PORT=0 lets the OS pick a free
 * port so we never collide with a server already running in another terminal.
 */
export function spawnGraphQLServer(opts: SpawnOptions): Promise<SpawnedServer> {
  const { serverPackageDir, repoCwd, readyTimeoutMs = 15_000 } = opts;

  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "src/index.ts", "--cwd", repoCwd], {
      cwd: serverPackageDir,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;
    let stdoutBuf = "";

    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      child.kill("SIGTERM");
      reject(
        new Error(`GraphQL server did not become ready in ${readyTimeoutMs}ms`),
      );
    }, readyTimeoutMs);

    const finishOk = (url: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      resolve({ url, child });
    };

    const finishErr = (err: Error) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      reject(err);
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString("utf8");
      let nl: number;
      while ((nl = stdoutBuf.indexOf("\n")) >= 0) {
        const line = stdoutBuf.slice(0, nl).trimEnd();
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (!resolved && line.startsWith("{")) {
          try {
            const msg = JSON.parse(line) as { type?: string; url?: string };
            if (msg.type === "ready" && typeof msg.url === "string") {
              finishOk(msg.url);
              continue;
            }
          } catch {
            // not JSON — fall through and log
          }
        }
        if (line) process.stdout.write(`[server] ${line}\n`);
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[server] ${chunk.toString("utf8")}`);
    });

    child.on("exit", (code, signal) => {
      finishErr(
        new Error(
          `GraphQL server exited before ready (code=${code} signal=${signal})`,
        ),
      );
    });

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        finishErr(
          new Error(
            "`bun` not found on PATH — the GraphQL server requires Bun. " +
              "Install it from https://bun.sh or set OPENTUI_GIT_ENDPOINT to " +
              "point at a server you've started yourself.",
          ),
        );
        return;
      }
      finishErr(err);
    });
  });
}
