import { useEffect, useRef, useState } from "react";
import type { CommentSelection } from "opentui-git/shared/comments";
import { Button } from "./ui/button.js";

function rangeLabel(selection: CommentSelection): string {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  return start === end ? `Line ${start}` : `Lines ${start}–${end}`;
}

export function CommentComposer({
  selection,
  initialValue = "",
  onSubmit,
  onCancel,
  submitLabel = "Add comment",
}: {
  selection: CommentSelection;
  initialValue?: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-popover border border-border rounded shadow-md min-w-[280px] max-w-[360px]">
      <div className="text-xs text-muted-foreground/80">
        {rangeLabel(selection)}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
            return;
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Leave a comment for the agent…"
        rows={3}
        className="resize-y min-h-[60px] w-full rounded border border-border bg-background px-2 py-1 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={!value.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
