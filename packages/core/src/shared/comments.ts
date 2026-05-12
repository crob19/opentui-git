export type CommentSide = "additions" | "deletions";

export type CommentSelection = {
  start: number;
  end: number;
  side?: CommentSide;
  endSide?: CommentSide;
};

export type LineComment = {
  id: string;
  file: string;
  selection: CommentSelection;
  comment: string;
  time: number;
};

export function formatCommentNote(input: {
  path: string;
  selection?: CommentSelection;
  comment: string;
}): string {
  const sel = input.selection;
  const range = (() => {
    if (!sel) return "this file";
    const start = Math.min(sel.start, sel.end);
    const end = Math.max(sel.start, sel.end);
    return start === end ? `line ${start}` : `lines ${start} through ${end}`;
  })();
  return `The user made the following comment regarding ${range} of ${input.path}: ${input.comment}`;
}

export function formatCommentBatch(items: LineComment[]): string {
  if (items.length === 0) return "";
  const lines = items
    .slice()
    .sort((a, b) => {
      if (a.file !== b.file) return a.file < b.file ? -1 : 1;
      return a.selection.start - b.selection.start;
    })
    .map((c) =>
      formatCommentNote({
        path: c.file,
        selection: c.selection,
        comment: c.comment,
      }),
    );
  return lines.join("\n\n");
}
