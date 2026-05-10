import { GitBranch, Terminal as TerminalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RemoteActions } from "./RemoteActions.js";
import { ThemePicker } from "./ThemePicker.js";

type Props = {
  repoRoot: string | null | undefined;
  isRepo: boolean | undefined;
  branch: string | null | undefined;
  ahead: number;
  behind: number;
  isClean: boolean;
  dirtyCount: number;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
};

export function StatusBar({
  repoRoot,
  isRepo,
  branch,
  ahead,
  behind,
  isClean,
  dirtyCount,
  terminalOpen,
  onToggleTerminal,
}: Props) {
  const repoLabel = isRepo
    ? (repoRoot?.split("/").pop() ?? repoRoot)
    : "not a git repo";

  return (
    <footer
      className="flex items-center gap-2 px-3 py-1.5 hairline-t text-xs text-muted-foreground font-mono"
      style={{ background: "var(--titlebar)" }}
    >
      <span className="text-foreground font-semibold" title={repoRoot ?? ""}>
        {repoLabel}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="flex items-center gap-1 text-git-branch">
        <GitBranch className="size-3" />
        {branch ?? "(detached)"}
      </span>
      <span
        style={{
          color: ahead > 0 ? "var(--dracula-cyan)" : "var(--fg-muted)",
        }}
      >
        ↑{ahead}
      </span>
      <span
        style={{
          color: behind > 0 ? "var(--dracula-pink)" : "var(--fg-muted)",
        }}
      >
        ↓{behind}
      </span>

      <RemoteActions ahead={ahead} behind={behind} />

      <span className="flex-1" />

      <ThemePicker />

      <button
        type="button"
        className={cn("sb-btn", terminalOpen && "on")}
        title="Toggle terminal"
        onClick={onToggleTerminal}
      >
        <TerminalIcon />
        <span>Terminal</span>
      </button>

      <span
        className={cn(
          "font-medium",
          isClean ? "text-git-clean" : "text-git-dirty",
        )}
      >
        {isClean ? "clean" : `${dirtyCount} changed`}
      </span>
    </footer>
  );
}
