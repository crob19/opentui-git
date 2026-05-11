import { TerminalSurface } from "./TerminalSurface.js";

export function TerminalTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: "var(--code)" }}>
      <TerminalSurface visible />
    </div>
  );
}
