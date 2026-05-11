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

let session: Session | null = null;
let initPromise: Promise<Session> | null = null;

async function ensureSession(): Promise<Session> {
  if (session) return session;
  if (initPromise) return initPromise;

  initPromise = (async () => {
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

    session = { id, term, fit, host, detachData, detachExit };
    return session;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

export function attachTerminal(container: HTMLDivElement): () => void {
  let detached = false;
  let observer: ResizeObserver | null = null;

  ensureSession()
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

export function disposeTerminal(): void {
  if (!session) return;
  const s = session;
  session = null;
  s.detachData();
  s.detachExit();
  window.opentui?.terminal.kill(s.id);
  s.term.dispose();
  s.host.remove();
}
