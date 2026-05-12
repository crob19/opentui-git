import type { LineComment } from "opentui-git/shared/comments";
import { Button } from "../ui/button.js";
import { X } from "lucide-react";

export function CommentAnnotationRow({
  comment,
  onEdit,
  onRemove,
}: {
  comment: LineComment;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mx-2 my-1 rounded border border-border bg-popover/80 p-2 text-sm font-sans shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1 whitespace-pre-wrap break-words">
          {comment.comment}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onRemove}
            aria-label="Remove comment"
            title="Remove comment"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
