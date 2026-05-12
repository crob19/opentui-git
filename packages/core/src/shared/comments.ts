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
  if (!sel) return `@${input.path}: ${input.comment}`;
  const start = Math.min(sel.start, sel.end);
  const end = Math.max(sel.start, sel.end);
  const range = start === end ? `line ${start}` : `lines ${start}–${end}`;
  return `@${input.path} (${range}): ${input.comment}`;
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
  const header =
    items.length === 1
      ? "Please address this comment:"
      : `Please address these ${items.length} comments:`;
  return `${header}\n\n${lines.join("\n\n")}`;
}
