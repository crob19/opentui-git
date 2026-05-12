import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CommentSelection,
  LineComment,
} from "opentui-git/shared/comments";

type CommentsState = {
  all: LineComment[];
  forFile: (file: string) => LineComment[];
  add: (input: {
    file: string;
    selection: CommentSelection;
    comment: string;
  }) => LineComment;
  update: (id: string, comment: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  removeForFile: (file: string) => void;
};

const CommentsContext = createContext<CommentsState | null>(null);

const STORAGE_PREFIX = "opentui.comments.v1.";

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

function load(projectId: string): LineComment[] {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function CommentsProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const [comments, setComments] = useState<LineComment[]>(() =>
    load(projectId),
  );

  // Reload when project changes (provider is keyed by projectId at the call site,
  // but cover the case where it isn't).
  const lastProject = useRef(projectId);
  useEffect(() => {
    if (lastProject.current === projectId) return;
    lastProject.current = projectId;
    setComments(load(projectId));
  }, [projectId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(comments));
    } catch {
      /* quota or disabled storage — silent */
    }
  }, [projectId, comments]);

  const add = useCallback(
    (input: { file: string; selection: CommentSelection; comment: string }) => {
      const next: LineComment = {
        id: uuid(),
        file: input.file,
        selection: { ...input.selection },
        comment: input.comment,
        time: Date.now(),
      };
      setComments((prev) => [...prev, next]);
      return next;
    },
    [],
  );

  const update = useCallback((id: string, comment: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comment } : c)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => setComments([]), []);

  const removeForFile = useCallback((file: string) => {
    setComments((prev) => prev.filter((c) => c.file !== file));
  }, []);

  const forFile = useCallback(
    (file: string) => comments.filter((c) => c.file === file),
    [comments],
  );

  const value = useMemo<CommentsState>(
    () => ({
      all: comments,
      forFile,
      add,
      update,
      remove,
      clear,
      removeForFile,
    }),
    [comments, forFile, add, update, remove, clear, removeForFile],
  );

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments(): CommentsState {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used within CommentsProvider");
  return ctx;
}
