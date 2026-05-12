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
          onRemove={() => comments.remove(c.id)}
        />
      );
    },
    [fileComments, comments, openEdit],
  );

  const composerNode = pending ? (
    <div className="absolute right-4 top-2 z-10">
      <CommentComposer
        selection={pending.selection}
        initialValue={pending.initial}
        submitLabel={pending.editingId ? "Save" : "Add comment"}
        onSubmit={(text) => submit(text)}
        onCancel={cancel}
      />
    </div>
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
