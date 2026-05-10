import { useQuery } from "@apollo/client/react/index.js";
import { useMemo } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import { DiffDocument, DefaultBranchDocument } from "@opentui-git/client";
import { useSelection } from "../state/selection.js";
import { ACTIVE_THEME } from "../lib/theme.js";

export function DiffViewer() {
  const { mode, selected } = useSelection();

  const branchQuery = useQuery(DefaultBranchDocument, {
    skip: mode !== "branch",
  });
  const compareBranch = branchQuery.data?.defaultBranch ?? null;
  const branchPending = mode === "branch" && !compareBranch;

  const diffOptions = useMemo(() => {
    if (mode === "branch")
      return compareBranch ? { branch: compareBranch } : null;
    return { staged: mode === "staged" };
  }, [mode, compareBranch]);

  const diffQuery = useQuery(DiffDocument, {
    variables: { path: selected ?? "", options: diffOptions },
    skip: !selected || !diffOptions,
  });

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Select a file to view its diff
      </div>
    );
  }

  if (branchPending || (diffQuery.loading && !diffQuery.data)) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
        Loading diff…
      </div>
    );
  }

  if (diffQuery.error) {
    return (
      <div className="flex-1 min-h-0 overflow-auto">
        <pre className="p-4 text-destructive whitespace-pre-wrap font-mono text-sm">
          {diffQuery.error.message}
        </pre>
      </div>
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
    <div className="flex-1 min-h-0 overflow-auto">
      <PatchDiff patch={patch} theme={ACTIVE_THEME.diff} />
    </div>
  );
}
