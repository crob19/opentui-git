import { useMutation } from "@apollo/client/react/index.js";
import {
  StageFileDocument,
  UnstageFileDocument,
  StageAllDocument,
  UnstageAllDocument,
  StatusDocument,
} from "@opentui-git/client";
import { useToast } from "./Toast.js";

type FileStatus = {
  path: string;
  workingDir: string;
  index: string;
  staged: boolean;
  statusText: string;
  color?: string | null;
  hasLocalChanges: boolean | null;
};

type Props = {
  files: FileStatus[];
};

export function FileList({ files }: Props) {
  const toast = useToast();
  const refetch = [{ query: StatusDocument }];

  const [stageFile] = useMutation(StageFileDocument, {
    refetchQueries: refetch,
  });
  const [unstageFile] = useMutation(UnstageFileDocument, {
    refetchQueries: refetch,
  });
  const [stageAll] = useMutation(StageAllDocument, { refetchQueries: refetch });
  const [unstageAll] = useMutation(UnstageAllDocument, {
    refetchQueries: refetch,
  });

  const staged = files.filter((f) => f.staged);
  const unstaged = files.filter((f) => !f.staged);

  const onStage = async (path: string) => {
    try {
      await stageFile({ variables: { path } });
    } catch (err) {
      toast.error(`Stage failed: ${(err as Error).message}`);
    }
  };

  const onUnstage = async (path: string) => {
    try {
      await unstageFile({ variables: { path } });
    } catch (err) {
      toast.error(`Unstage failed: ${(err as Error).message}`);
    }
  };

  const onStageAll = async () => {
    try {
      await stageAll();
      toast.success("Staged all changes");
    } catch (err) {
      toast.error(`Stage all failed: ${(err as Error).message}`);
    }
  };

  const onUnstageAll = async () => {
    try {
      await unstageAll();
      toast.success("Unstaged all changes");
    } catch (err) {
      toast.error(`Unstage all failed: ${(err as Error).message}`);
    }
  };

  return (
    <div style={styles.wrap}>
      <Section
        title="Staged"
        count={staged.length}
        action={
          staged.length > 0
            ? { label: "Unstage all", onClick: onUnstageAll }
            : undefined
        }
      >
        {staged.length === 0 ? (
          <Empty text="Nothing staged yet" />
        ) : (
          staged.map((f) => (
            <Row
              key={`s-${f.path}`}
              file={f}
              actionLabel="Unstage"
              onAction={() => onUnstage(f.path)}
            />
          ))
        )}
      </Section>

      <Section
        title="Changes"
        count={unstaged.length}
        action={
          unstaged.length > 0
            ? { label: "Stage all", onClick: onStageAll }
            : undefined
        }
      >
        {unstaged.length === 0 ? (
          <Empty text="No unstaged changes" />
        ) : (
          unstaged.map((f) => (
            <Row
              key={`u-${f.path}`}
              file={f}
              actionLabel="Stage"
              onAction={() => onStage(f.path)}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <header style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>
          {title} <span style={styles.sectionCount}>({count})</span>
        </span>
        {action && (
          <button style={styles.headerBtn} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </header>
      <ul style={styles.list}>{children}</ul>
    </section>
  );
}

function Row({
  file,
  actionLabel,
  onAction,
}: {
  file: FileStatus;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <li style={styles.row}>
      <code
        style={{
          ...styles.statusText,
          color: file.color ?? "#888",
        }}
      >
        {file.statusText}
      </code>
      <span style={styles.path}>{file.path}</span>
      <button style={styles.rowBtn} onClick={onAction}>
        {actionLabel}
      </button>
    </li>
  );
}

function Empty({ text }: { text: string }) {
  return <li style={styles.empty}>{text}</li>;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: 16, minHeight: 0 },
  section: { display: "flex", flexDirection: "column", minHeight: 0 },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    background: "#1f1f1f",
    borderBottom: "1px solid #2a2a2a",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#888",
  },
  sectionTitle: { color: "#ccc" },
  sectionCount: { color: "#666" },
  headerBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#ccc",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  list: { listStyle: "none", margin: 0, padding: 0, overflowY: "auto" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 12px",
    fontSize: 13,
    borderBottom: "1px solid #1f1f1f",
  },
  statusText: {
    width: 24,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontWeight: 600,
  },
  path: {
    flex: 1,
    color: "#e6e6e6",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rowBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#ccc",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    cursor: "pointer",
    visibility: "visible",
  },
  empty: {
    padding: "8px 12px",
    color: "#666",
    fontStyle: "italic",
    fontSize: 12,
  },
};
