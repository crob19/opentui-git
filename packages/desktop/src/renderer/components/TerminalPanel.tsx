import { ArrowUpRight, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalSurface } from "./TerminalSurface.js";

type Props = {
  visible: boolean;
  projectId: string;
  cwd: string;
  onOpenAsTab: () => void;
};

export function TerminalPanel({ visible, projectId, cwd, onOpenAsTab }: Props) {
  return (
    <div
      className="hairline-t h-72"
      style={{
        display: visible ? "block" : "none",
        background: "var(--code)",
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <TerminalIcon className="size-3.5" />
            <span>Terminal</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={onOpenAsTab}
          >
            <ArrowUpRight className="size-3.5" />
            Open as tab
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          {visible && <TerminalSurface projectId={projectId} cwd={cwd} />}
        </div>
      </div>
    </div>
  );
}
