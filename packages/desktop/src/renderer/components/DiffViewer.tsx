import { useQuery } from "@apollo/client/react/index.js";
import { useMemo, useState, useEffect, useCallback } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import type { DiffLineAnnotation, SelectedLineRange } from "@pierre/diffs";
import { DiffDocument } from "@opentui-git/client";
import type { CommentSelection } from "opentui-git/shared/comments";
import type { FileSelectionTab } from "../state/selection.js";
import { Button } from "./ui/button.js";
import { Columns, Rows } from "lucide-react";
import { CommentToolbar } from "./comments/CommentToolbar.js";
import { GutterCommentButton } from "./comments/GutterButton.js";
import { useCommentComposer } from "./comments/useCommentComposer.js";

type DiffStyle = "unified" | "split";
const DIFF_STYLE_KEY = "diffViewer.diffStyle";

type CommentMeta = { commentId: string };

function toCommentSelection(range: SelectedLineRange): CommentSelection {
  const out: CommentSelection = { start: range.start, end: range.end };
  if (range.side) out.side = range.side;
  if (range.endSide) out.endSide = range.endSide;
  return out;
}

function singleLineSelection(
  lineNumber: number,
  side: "additions" | "deletions",
): CommentSelection {
  return { start: lineNumber, end: lineNumber, side, endSide: side };
}

export function DiffViewer({
  tab,
  projectId,
}: {
  tab: FileSelectionTab;
  projectId: string;
}) {
  const branchPending = tab.mode === "branch" && !tab.compareBranch;

  const [diffStyle, setDiffStyle] = useState<DiffStyle>(() => {
    const stored = localStorage.getItem(DIFF_STYLE_KEY);
    return stored === "split" || stored === "unified" ? stored : "unified";
  });

  useEffect(() => {
    localStorage.setItem(DIFF_STYLE_KEY, diffStyle);
  }, [diffStyle]);

  const [selected, setSelected] = useState<SelectedLineRange | null>(null);

  const composer = useCommentComposer(tab.path);
  const { fileComments, openFor, renderAnnotationFor, composerNode } = composer;

  const diffOptions = useMemo(() => {
    if (tab.mode === "branch")
      return tab.compareBranch ? { branch: tab.compareBranch } : null;
    return { staged: tab.mode === "staged" };
  }, [tab.compareBranch, tab.mode]);

  const patchOptions = useMemo(
    () => ({
      diffStyle,
      enableLineSelection: true,
      enableGutterUtility: true,
      onLineSelectionEnd: (range: SelectedLineRange | null) => {
        setSelected(range);
      },
    }),
    [diffStyle],
  );

  const lineAnnotations = useMemo<DiffLineAnnotation<CommentMeta>[]>(() => {
    return fileComments.map((c) => {
      const end = Math.max(c.selection.start, c.selection.end);
      const side = c.selection.endSide ?? c.selection.side ?? "additions";
      return {
        lineNumber: end,
        side,
        metadata: { commentId: c.id },
      } satisfies DiffLineAnnotation<CommentMeta>;
    });
  }, [fileComments]);

  const renderAnnotation = useCallback(
    (annotation: DiffLineAnnotation<CommentMeta>) =>
      renderAnnotationFor(annotation.metadata.commentId),
    [renderAnnotationFor],
  );

  const renderGutterUtility = useCallback(
    (
      getHoveredLine: () =>
        | { lineNumber: number; side: "additions" | "deletions" }
        | undefined,
    ) => {
      const onClick = () => {
        if (selected) {
          openFor(toCommentSelection(selected));
          setSelected(null);
          return;
        }
        const hovered = getHoveredLine();
        if (!hovered) return;
        openFor(singleLineSelection(hovered.lineNumber, hovered.side));
      };
      return <GutterCommentButton onClick={onClick} />;
    },
    [openFor, selected],
  );

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
      <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-border/40">
        <div className="text-xs text-muted-foreground/70">
          {fileComments.length > 0
            ? `${fileComments.length} comment${fileComments.length === 1 ? "" : "s"}`
            : ""}
        </div>
        <div className="flex items-center gap-1">
          <CommentToolbar projectId={projectId} filePath={tab.path} />
          <Button
            size="sm"
            variant={diffStyle === "unified" ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
            onClick={() => setDiffStyle("unified")}
            title="Unified"
            aria-label="Unified"
          >
            <Rows className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant={diffStyle === "split" ? "secondary" : "ghost"}
            className="h-6 w-6 p-0"
            onClick={() => setDiffStyle("split")}
            title="Side by side"
            aria-label="Side by side"
          >
            <Columns className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto relative">
        <PatchDiff<CommentMeta>
          patch={patch}
          options={patchOptions}
          selectedLines={selected}
          lineAnnotations={lineAnnotations}
          renderAnnotation={renderAnnotation}
          renderGutterUtility={renderGutterUtility}
        />
        {composerNode}
      </div>
    </div>
  );
}
