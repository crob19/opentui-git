import { useQuery } from "@apollo/client/react/index.js";
import { useMemo, useState, useEffect, useCallback } from "react";
import { PatchDiff } from "@pierre/diffs/react";
import type { DiffLineAnnotation, SelectedLineRange } from "@pierre/diffs";
import { DiffDocument } from "@opentui-git/client";
import {
  formatCommentBatch,
  type CommentSelection,
  type LineComment,
} from "opentui-git/shared/comments";
import type { FileSelectionTab } from "../state/selection.js";
import { useComments } from "../state/comments.js";
import { hasTerminalSession, writeToTerminal } from "../lib/terminalSession.js";
import { Button } from "./ui/button.js";
import { CommentComposer } from "./CommentComposer.js";
import { Columns, MessageSquarePlus, Rows, Send, X } from "lucide-react";
import { toast } from "sonner";

type DiffStyle = "unified" | "split";
const DIFF_STYLE_KEY = "diffViewer.diffStyle";

type CommentMeta = { commentId: string };

type Pending = {
  selection: CommentSelection;
  initial?: string;
  editingId?: string;
};

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
  const comments = useComments();
  const fileComments = comments.forFile(tab.path);

  const [diffStyle, setDiffStyle] = useState<DiffStyle>(() => {
    const stored = localStorage.getItem(DIFF_STYLE_KEY);
    return stored === "split" || stored === "unified" ? stored : "unified";
  });

  useEffect(() => {
    localStorage.setItem(DIFF_STYLE_KEY, diffStyle);
  }, [diffStyle]);

  const [selected, setSelected] = useState<SelectedLineRange | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const diffOptions = useMemo(() => {
    if (tab.mode === "branch")
      return tab.compareBranch ? { branch: tab.compareBranch } : null;
    return { staged: tab.mode === "staged" };
  }, [tab.compareBranch, tab.mode]);

  const openComposerFor = useCallback((sel: CommentSelection) => {
    setPending({ selection: sel });
  }, []);

  const openEditor = useCallback((c: LineComment) => {
    setPending({
      selection: c.selection,
      initial: c.comment,
      editingId: c.id,
    });
  }, []);

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
    (annotation: DiffLineAnnotation<CommentMeta>) => {
      const c = fileComments.find(
        (x) => x.id === annotation.metadata.commentId,
      );
      if (!c) return null;
      return (
        <div className="mx-2 my-1 rounded border border-border bg-popover/80 p-2 text-sm font-sans shadow-sm">
          <div className="flex items-start gap-2">
            <div className="flex-1 whitespace-pre-wrap break-words">
              {c.comment}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => openEditor(c)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => comments.remove(c.id)}
                aria-label="Remove comment"
                title="Remove comment"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      );
    },
    [fileComments, comments, openEditor],
  );

  const renderGutterUtility = useCallback(
    (
      getHoveredLine: () =>
        | { lineNumber: number; side: "additions" | "deletions" }
        | undefined,
    ) => {
      const onClick = () => {
        if (selected) {
          openComposerFor(toCommentSelection(selected));
          return;
        }
        const hovered = getHoveredLine();
        if (!hovered) return;
        openComposerFor(singleLineSelection(hovered.lineNumber, hovered.side));
      };
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label="Add comment"
          title="Add comment"
          className="flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MessageSquarePlus className="h-3 w-3" />
        </button>
      );
    },
    [openComposerFor, selected],
  );

  const diffQuery = useQuery(DiffDocument, {
    variables: { path: tab.path, options: diffOptions },
    skip: !diffOptions,
  });

  const sendToTerminal = () => {
    if (fileComments.length === 0) return;
    if (!hasTerminalSession(projectId)) {
      toast.error("Open the terminal first so the agent is running.");
      return;
    }
    const note = formatCommentBatch(fileComments);
    const ok = writeToTerminal(projectId, note + "\r");
    if (!ok) {
      toast.error("Couldn't reach the terminal.");
      return;
    }
    toast.success(
      `Sent ${fileComments.length} comment${fileComments.length === 1 ? "" : "s"}.`,
    );
  };

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
          {fileComments.length > 0 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={sendToTerminal}
                title="Send comments to terminal"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Send to terminal
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => comments.removeForFile(tab.path)}
                title="Clear comments for this file"
              >
                Clear
              </Button>
              <div className="w-px h-4 bg-border/40 mx-1" />
            </>
          )}
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
        {pending && (
          <div className="absolute right-4 top-2 z-10">
            <CommentComposer
              selection={pending.selection}
              initialValue={pending.initial}
              submitLabel={pending.editingId ? "Save" : "Add comment"}
              onSubmit={(text) => {
                if (pending.editingId) {
                  comments.update(pending.editingId, text);
                } else {
                  comments.add({
                    file: tab.path,
                    selection: pending.selection,
                    comment: text,
                  });
                }
                setPending(null);
                setSelected(null);
              }}
              onCancel={() => setPending(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
