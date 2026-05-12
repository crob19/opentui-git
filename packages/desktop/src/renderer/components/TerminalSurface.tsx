import { useEffect, useRef } from "react";
import { attachTerminal } from "@/lib/terminalSession";

export function TerminalSurface({
  projectId,
  cwd,
}: {
  projectId: string;
  cwd: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return attachTerminal(container, projectId, cwd);
  }, [projectId, cwd]);

  return (
    <div ref={containerRef} className="min-h-0 h-full w-full flex-1 p-2" />
  );
}
