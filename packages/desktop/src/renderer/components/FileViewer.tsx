import { useQuery } from "@apollo/client/react/index.js";
import { useCallback, useMemo, useState } from "react";
import { File } from "@pierre/diffs/react";
import type { LineAnnotation, SelectedLineRange } from "@pierre/diffs";
import { ReadFileDocument } from "@opentui-git/client";
import type { CommentSelection } from "opentui-git/shared/comments";
import type { FileSelectionTab } from "../state/selection.js";
import { CommentToolbar } from "./comments/CommentToolbar.js";
import { GutterCommentButton } from "./comments/GutterButton.js";
import { useCommentComposer } from "./comments/useCommentComposer.js";

const MAX_CHARS = 1024 * 1024;

type CommentMeta = { commentId: string };

function toCommentSelection(range: SelectedLineRange): CommentSelection {
  return { start: range.start, end: range.end };
}

function singleLineSelection(lineNumber: number): CommentSelection {
  return { start: lineNumber, end: lineNumber };
}

export function FileViewer({
  tab,
  projectId,
}: {
  tab: FileSelectionTab;
  projectId: string;
}) {
  const { data, loading, error } = useQuery(ReadFileDocument, {
    variables: { path: tab.path },
  });

  const content = data?.readFile?.content ?? "";
  const tooLarge = content.length > MAX_CHARS;
  const binary = !tooLarge && containsBinary(content);
  const renderable = !!data && !tooLarge && !binary;

  const [selected, setSelected] = useState<SelectedLineRange | null>(null);

  const composer = useCommentComposer(tab.path);
  const { fileComments, openFor, renderAnnotationFor, composerNode } = composer;

  const fileOptions = useMemo(
    () => ({
      enableLineSelection: true,
      enableGutterUtility: true,
      onLineSelectionEnd: (range: SelectedLineRange | null) => {
        setSelected(range);
      },
    }),
    [],
  );

  const lineAnnotations = useMemo<LineAnnotation<CommentMeta>[]>(() => {
    return fileComments.map((c) => ({
      lineNumber: Math.max(c.selection.start, c.selection.end),
      metadata: { commentId: c.id },
    }));
  }, [fileComments]);

  const renderAnnotation = useCallback(
    (annotation: LineAnnotation<CommentMeta>) =>
      renderAnnotationFor(annotation.metadata.commentId),
    [renderAnnotationFor],
  );

  const renderGutterUtility = useCallback(
    (getHoveredLine: () => { lineNumber: number } | undefined) => {
      const onClick = () => {
        if (selected) {
          openFor(toCommentSelection(selected));
          setSelected(null);
          return;
        }
        const hovered = getHoveredLine();
        if (!hovered) return;
        openFor(singleLineSelection(hovered.lineNumber));
      };
      return <GutterCommentButton onClick={onClick} />;
    },
    [openFor, selected],
  );

  const fileContents = useMemo(
    () => ({ name: tab.path, contents: content }),
    [tab.path, content],
  );

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-0 overflow-auto">
        <pre className="p-4 text-destructive whitespace-pre-wrap font-mono text-sm">
          {error.message}
        </pre>
      </div>
    );
  }

  if (tooLarge) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        File is too large to preview (
        {(content.length / 1024 / 1024).toFixed(1)}M chars)
      </div>
    );
  }

  if (binary) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Binary file — preview not available
      </div>
    );
  }

  if (!renderable) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Nothing to display
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
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto relative">
        <File<CommentMeta>
          file={fileContents}
          options={fileOptions}
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

function containsBinary(s: string): boolean {
  const sample = s.slice(0, 8192);
  return sample.indexOf("\0") !== -1;
}
