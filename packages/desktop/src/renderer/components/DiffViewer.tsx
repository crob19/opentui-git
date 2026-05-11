import { useQuery } from "@apollo/client/react/index.js";
import { useMemo, useState, useEffect } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import { DiffDocument } from "@opentui-git/client";
import type { FileSelectionTab } from "../state/selection.js";
import { Button } from "./ui/button.js";

type DiffStyle = "unified" | "split";
const DIFF_STYLE_KEY = "diffViewer.diffStyle";

export function DiffViewer({ tab }: { tab: FileSelectionTab }) {
  const branchPending = tab.mode === "branch" && !tab.compareBranch;

  const [diffStyle, setDiffStyle] = useState<DiffStyle>(() => {
    const stored = localStorage.getItem(DIFF_STYLE_KEY);
    return stored === "split" || stored === "unified" ? stored : "unified";
  });

  useEffect(() => {
    localStorage.setItem(DIFF_STYLE_KEY, diffStyle);
  }, [diffStyle]);

  const diffOptions = useMemo(() => {
    if (tab.mode === "branch")
      return tab.compareBranch ? { branch: tab.compareBranch } : null;
    return { staged: tab.mode === "staged" };
  }, [tab.compareBranch, tab.mode]);

  const patchOptions = useMemo(() => ({ diffStyle }), [diffStyle]);

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
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-border/40">
        <Button
          size="sm"
          variant={diffStyle === "unified" ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs"
          onClick={() => setDiffStyle("unified")}
        >
          Unified
        </Button>
        <Button
          size="sm"
          variant={diffStyle === "split" ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs"
          onClick={() => setDiffStyle("split")}
        >
          Side by side
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <PatchDiff patch={patch} options={patchOptions} />
      </div>
    </div>
  );
}
