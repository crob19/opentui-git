import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  repoRoot: string | null | undefined;
  isRepo: boolean | undefined;
  branch: string | null | undefined;
  ahead: number;
  behind: number;
  isClean: boolean;
  dirtyCount: number;
};

export function StatusBar({
  repoRoot,
  isRepo,
  branch,
  ahead,
  behind,
  isClean,
  dirtyCount,
}: Props) {
  const repoLabel = isRepo
    ? (repoRoot?.split("/").pop() ?? repoRoot)
    : "not a git repo";

  return (
    <footer className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-t border-border text-xs text-muted-foreground font-mono">
      <span className="text-foreground font-semibold" title={repoRoot ?? ""}>
        {repoLabel}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="flex items-center gap-1 text-blue-400">
        <GitBranch className="size-3" />
        {branch ?? "(detached)"}
      </span>
      <span className="text-muted-foreground/70">
        ↑{ahead} ↓{behind}
      </span>
      <span className="flex-1" />
      <span
        className={cn(
          "font-medium",
          isClean ? "text-green-500" : "text-amber-400",
        )}
      >
        {isClean ? "clean" : `${dirtyCount} changed`}
      </span>
    </footer>
  );
}
