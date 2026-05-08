import { useMutation } from "@apollo/client/react/index.js";
import { useState } from "react";
import { CommitDocument, StatusDocument } from "@opentui-git/client";
import { useToast } from "./Toast.js";

type Props = {
  stagedCount: number;
  stagedPaths: string[];
};

export function CommitPanel({ stagedCount, stagedPaths }: Props) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [commit, { loading }] = useMutation(CommitDocument, {
    refetchQueries: [{ query: StatusDocument }],
  });

  const trimmed = message.trim();
  const canCommit = stagedCount > 0 && trimmed.length > 0 && !loading;

  const submit = async () => {
    if (!canCommit) return;
    try {
      const res = await commit({ variables: { message: trimmed } });
      if (res.data?.commit?.success) {
        toast.success(`Committed ${stagedCount} file(s)`);
        setMessage("");
      } else {
        toast.error("Commit failed");
      }
    } catch (err) {
      toast.error(`Commit failed: ${(err as Error).message}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>Commit</span>
        <span style={styles.count}>
          {stagedCount} file{stagedCount === 1 ? "" : "s"} staged
        </span>
      </div>

      {stagedCount > 0 && (
        <ul style={styles.preview}>
          {stagedPaths.slice(0, 5).map((p) => (
            <li key={p} style={styles.previewItem}>
              {p}
            </li>
          ))}
          {stagedPaths.length > 5 && (
            <li style={styles.previewMore}>
              …and {stagedPaths.length - 5} more
            </li>
          )}
        </ul>
      )}

      <textarea
        style={styles.textarea}
        placeholder="Commit message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
      />

      <div style={styles.actions}>
        <span style={styles.hint}>{canCommit ? "⌘+Enter to commit" : ""}</span>
        <button
          style={{
            ...styles.commitBtn,
            ...(canCommit ? {} : styles.commitBtnDisabled),
          }}
          onClick={submit}
          disabled={!canCommit}
        >
          {loading ? "Committing…" : "Commit"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #2a2a2a",
    background: "#161616",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#888",
  },
  count: { fontSize: 11, color: "#666" },
  preview: {
    listStyle: "none",
    margin: 0,
    padding: "4px 8px",
    background: "#1c1c1c",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    maxHeight: 88,
    overflowY: "auto",
    fontSize: 12,
    color: "#bbb",
  },
  previewItem: { padding: "2px 0", fontFamily: "ui-monospace, monospace" },
  previewMore: { padding: "2px 0", color: "#666", fontStyle: "italic" },
  textarea: {
    background: "#0e0e0e",
    color: "#e6e6e6",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    padding: 8,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    resize: "vertical",
    minHeight: 60,
    outline: "none",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: { fontSize: 11, color: "#666" },
  commitBtn: {
    background: "#2d6cdf",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  commitBtnDisabled: {
    background: "#2a2a2a",
    color: "#666",
    cursor: "not-allowed",
  },
};
