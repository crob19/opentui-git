import { useCallback, useState } from "react";
import type {
  CommentSelection,
  LineComment,
} from "opentui-git/shared/comments";
import { useComments } from "../../state/comments.js";
import { CommentComposer } from "../CommentComposer.js";
import { CommentAnnotationRow } from "./CommentAnnotation.js";

type Pending = {
  selection: CommentSelection;
  initial?: string;
  editingId?: string;
};

export function useCommentComposer(filePath: string) {
  const comments = useComments();
  const fileComments = comments.forFile(filePath);
  const [pending, setPending] = useState<Pending | null>(null);

  const openFor = useCallback((selection: CommentSelection) => {
    setPending({ selection });
  }, []);

  const openEdit = useCallback((c: LineComment) => {
    setPending({
      selection: c.selection,
      initial: c.comment,
      editingId: c.id,
    });
  }, []);

  const cancel = useCallback(() => setPending(null), []);

  const submit = useCallback(
    (text: string, onSubmitted?: () => void) => {
      if (!pending) return;
      if (pending.editingId) {
        comments.update(pending.editingId, text);
      } else {
        comments.add({
          file: filePath,
          selection: pending.selection,
          comment: text,
        });
      }
      setPending(null);
      onSubmitted?.();
    },
    [comments, filePath, pending],
  );

  const renderAnnotationFor = useCallback(
    (commentId: string) => {
      const c = fileComments.find((x) => x.id === commentId);
      if (!c) return null;
      return (
        <CommentAnnotationRow
          comment={c}
          onEdit={() => openEdit(c)}
          onRemove={() => comments.remove(commentId)}
        />
      );
    },
    [fileComments, comments, openEdit],
  );

  const composerNode = pending ? (
    <>
      <div
        className="absolute inset-0 z-10 bg-background/40"
        onPointerDown={(e) => {
          e.stopPropagation();
          cancel();
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <CommentComposer
          selection={pending.selection}
          initialValue={pending.initial}
          submitLabel={pending.editingId ? "Save" : "Add comment"}
          onSubmit={(text) => submit(text)}
          onCancel={cancel}
        />
      </div>
    </>
  ) : null;

  return {
    fileComments,
    pending,
    openFor,
    openEdit,
    cancel,
    submit,
    renderAnnotationFor,
    composerNode,
  };
}
