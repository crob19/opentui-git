import { Terminal, FitAddon } from "ghostty-web";
import { loadGhostty } from "./ghostty";

type Session = {
  id: string;
  term: Terminal;
  fit: FitAddon;
  host: HTMLDivElement;
  detachData: () => void;
  detachExit: () => void;
};

// Keyed by project id, not cwd: two windows on the same repo (or a future
// split-terminal feature) need independent sessions.
const sessions = new Map<string, Session>();
const pending = new Map<string, Promise<Session>>();

async function ensureSession(projectId: string, cwd: string): Promise<Session> {
  const existing = sessions.get(projectId);
  if (existing) return existing;
  const inFlight = pending.get(projectId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const ghostty = await loadGhostty();

    const host = document.createElement("div");
    host.style.width = "100%";
    host.style.height = "100%";

    const term = new Terminal({
      ghostty,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
      fontSize: 13,
      theme: {
        background: "#0b0b0e",
        foreground: "#e6e6e6",
        cursor: "#e6e6e6",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);

    const id = crypto.randomUUID();
    const result = await window.opentui!.terminal.start({
      id,
      cols: term.cols,
      rows: term.rows,
      cwd,
    });
    if (!result.ok) {
      term.write(`\r\n[failed to start terminal: ${result.error}]\r\n`);
      term.dispose();
      throw new Error(result.error);
    }

    const detachData = window.opentui!.terminal.onData(id, (data) => {
      term.write(data);
    });
    const detachExit = window.opentui!.terminal.onExit(id, () => {
      term.write("\r\n[process exited]\r\n");
    });
    term.onData((data) => {
      window.opentui!.terminal.write(id, data);
    });

    const session: Session = { id, term, fit, host, detachData, detachExit };
    sessions.set(projectId, session);
    return session;
  })();

  pending.set(projectId, promise);
  try {
    return await promise;
  } finally {
    pending.delete(projectId);
  }
}

export function attachTerminal(
  container: HTMLDivElement,
  projectId: string,
  cwd: string,
): () => void {
  let detached = false;
  let observer: ResizeObserver | null = null;

  ensureSession(projectId, cwd)
    .then((s) => {
      if (detached) return;
      container.appendChild(s.host);
      const refit = () => {
        if (s.host.offsetWidth === 0 || s.host.offsetHeight === 0) return;
        try {
          s.fit.fit();
          window.opentui!.terminal.resize(s.id, s.term.cols, s.term.rows);
        } catch {
          /* host may not be laid out yet */
        }
      };
      refit();
      observer = new ResizeObserver(refit);
      observer.observe(s.host);
    })
    .catch((err) => {
      console.error("[terminal] init failed", err);
    });

  return () => {
    detached = true;
    observer?.disconnect();
    observer = null;
    // Leave host in place; the next attach reparents it via appendChild.
  };
}

export function hasTerminalSession(projectId: string): boolean {
  return sessions.has(projectId);
}

export function writeToTerminal(projectId: string, data: string): boolean {
  const s = sessions.get(projectId);
  if (!s) return false;
  window.opentui?.terminal.write(s.id, data);
  return true;
}

export function disposeTerminal(projectId: string): void {
  const s = sessions.get(projectId);
  if (!s) return;
  sessions.delete(projectId);
  s.detachData();
  s.detachExit();
  window.opentui?.terminal.kill(s.id);
  s.term.dispose();
  s.host.remove();
}
