import { MessageSquarePlus } from "lucide-react";

export function GutterCommentButton({ onClick }: { onClick: () => void }) {
  // Sits inside @pierre/diffs' [data-gutter-utility-slot]. The slot is
  // position: absolute on top of the gutter, but the line-number cells
  // paint above it without an explicit stacking order. Force this control
  // to the top with position: relative + z-index, and give it a solid
  // background so it visually covers the underlying number.
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Add comment"
      title="Add comment"
      className="relative z-20 flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm ring-1 ring-background hover:bg-primary/90"
    >
      <MessageSquarePlus className="h-3 w-3" />
    </button>
  );
}
