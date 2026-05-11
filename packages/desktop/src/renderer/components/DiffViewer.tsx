import { useQuery } from "@apollo/client/react/index.js";
import { useMemo } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import { DiffDocument } from "@opentui-git/client";
import type { SelectionTab } from "../state/selection.js";

export function DiffViewer({ tab }: { tab: SelectionTab }) {
  const branchPending = tab.mode === "branch" && !tab.compareBranch;

  const diffOptions = useMemo(() => {
    if (tab.mode === "branch")
      return tab.compareBranch ? { branch: tab.compareBranch } : null;
    return { staged: tab.mode === "staged" };
  }, [tab.compareBranch, tab.mode]);

  const diffQuery = useQuery(DiffDocument, {
    variables: { path: tab.path, options: diffOptions },
    skip: !diffOptions,
  });

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
        No changes for {tab.path}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <PatchDiff patch={patch} />
    </div>
  );
}
