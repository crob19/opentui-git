import { useQuery } from "@apollo/client/react/index.js";
import { useMemo } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import { DiffDocument, DefaultBranchDocument } from "@opentui-git/client";
import { useSelection } from "../state/selection.js";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DiffViewer() {
  const { mode, selected } = useSelection();

  const branchQuery = useQuery(DefaultBranchDocument, {
    skip: mode !== "branch",
  });
  const compareBranch = branchQuery.data?.defaultBranch ?? null;

  const diffOptions = useMemo(() => {
    if (mode === "branch")
      return compareBranch ? { branch: compareBranch } : null;
    return { staged: mode === "staged" };
  }, [mode, compareBranch]);

  const diffQuery = useQuery(DiffDocument, {
    variables:
      selected && diffOptions
        ? { path: selected, options: diffOptions }
        : { path: "", options: null },
    skip: !selected || !diffOptions,
  });

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Select a file to view its diff
      </div>
    );
  }

  if (diffQuery.loading && !diffQuery.data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
        Loading diff…
      </div>
    );
  }

  if (diffQuery.error) {
    return (
      <ScrollArea className="flex-1">
        <pre className="p-4 text-destructive whitespace-pre-wrap font-mono text-sm">
          {diffQuery.error.message}
        </pre>
      </ScrollArea>
    );
  }

  const patch = diffQuery.data?.diff ?? "";

  if (!patch.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        No changes for {selected}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <PatchDiff patch={patch} />
    </ScrollArea>
  );
}
