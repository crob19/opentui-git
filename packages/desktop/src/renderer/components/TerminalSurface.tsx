import { useEffect, useRef } from "react";
import { Terminal, FitAddon } from "ghostty-web";
import { loadGhostty } from "@/lib/ghostty";

type Session = {
  id: string;
  term: Terminal;
  fit: FitAddon;
  detachData: () => void;
  detachExit: () => void;
  resizeObs: ResizeObserver;
};

export function TerminalSurface({ visible }: { visible: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    if (initStartedRef.current) {
      const s = sessionRef.current;
      if (s) {
        try {
          s.fit.fit();
          window.opentui!.terminal.resize(s.id, s.term.cols, s.term.rows);
        } catch {
          /* container may not be laid out yet */
        }
      }
      return;
    }
    initStartedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const id = crypto.randomUUID();

    (async () => {
      await waitForContainerLayout(container, () => cancelled);
      if (cancelled) return;

      const ghostty = await loadGhostty();
      if (cancelled) return;

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
      term.open(container);
      fit.fit();

      const result = await window.opentui!.terminal.start({
        id,
        cols: term.cols,
        rows: term.rows,
      });
      if (cancelled) {
        term.dispose();
        return;
      }
      if (!result.ok) {
        term.write(`\r\n[failed to start terminal: ${result.error}]\r\n`);
        return;
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

      const resizeObs = new ResizeObserver(() => {
        if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
        try {
          fit.fit();
          window.opentui!.terminal.resize(id, term.cols, term.rows);
        } catch {
          /* container may be hidden */
        }
      });
      resizeObs.observe(container);

      sessionRef.current = { id, term, fit, detachData, detachExit, resizeObs };
    })().catch((err) => {
      console.error("[terminal] init failed", err);
    });

    return () => {
      cancelled = true;
      initStartedRef.current = false;
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      const s = sessionRef.current;
      if (!s) return;
      s.detachData();
      s.detachExit();
      s.resizeObs.disconnect();
      window.opentui?.terminal.kill(s.id);
      s.term.dispose();
      sessionRef.current = null;
      initStartedRef.current = false;
    };
  }, []);

  return <div ref={containerRef} className="min-h-0 h-full w-full flex-1 p-2" />;
}

async function waitForContainerLayout(
  container: HTMLDivElement,
  isCancelled: () => boolean,
): Promise<void> {
  if (container.offsetWidth > 0 && container.offsetHeight > 0) return;

  await new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (isCancelled()) {
        observer.disconnect();
        resolve();
        return;
      }
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(container);

    requestAnimationFrame(() => {
      if (isCancelled()) {
        observer.disconnect();
        resolve();
        return;
      }
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        observer.disconnect();
        resolve();
      }
    });
  });
}
