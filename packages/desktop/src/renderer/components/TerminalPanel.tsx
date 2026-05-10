import { useEffect, useRef } from "react";
import { Terminal, FitAddon } from "ghostty-web";
import { loadGhostty } from "@/lib/ghostty";

let sessionCounter = 0;

export function TerminalPanel({ visible }: { visible: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    const id = `term-${++sessionCounter}`;
    let disposed = false;
    let term: Terminal | null = null;
    let fit: FitAddon | null = null;
    let detachData: (() => void) | null = null;
    let detachExit: (() => void) | null = null;
    let resizeObs: ResizeObserver | null = null;

    (async () => {
      const ghostty = await loadGhostty();
      if (disposed) return;

      term = new Terminal({
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
      fit = new FitAddon();
      term.loadAddon(fit);
      term.open(container);
      fit.fit();

      const cwd = window.opentui?.cwd ?? "";
      await window.opentui!.terminal.start({
        id,
        cwd,
        cols: term.cols,
        rows: term.rows,
      });

      detachData = window.opentui!.terminal.onData(id, (data) => {
        term?.write(data);
      });
      detachExit = window.opentui!.terminal.onExit(id, () => {
        term?.write("\r\n[process exited]\r\n");
      });
      term.onData((data) => {
        window.opentui!.terminal.write(id, data);
      });

      resizeObs = new ResizeObserver(() => {
        if (!fit || !term) return;
        try {
          fit.fit();
          window.opentui!.terminal.resize(id, term.cols, term.rows);
        } catch {
          /* container may be hidden */
        }
      });
      resizeObs.observe(container);
    })();

    return () => {
      disposed = true;
      detachData?.();
      detachExit?.();
      resizeObs?.disconnect();
      window.opentui?.terminal.kill(id);
      term?.dispose();
    };
  }, [visible]);

  return (
    <div
      className={`border-t border-border bg-[#0b0b0e] ${
        visible ? "h-72" : "hidden"
      }`}
    >
      <div ref={containerRef} className="h-full w-full p-2" />
    </div>
  );
}
