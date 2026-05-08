type Props = {
  repoRoot: string | null | undefined;
  isRepo: boolean | undefined;
  branch: string | null | undefined;
  ahead: number;
  behind: number;
  isClean: boolean;
  dirtyCount: number;
};

export function StatusBar({
  repoRoot,
  isRepo,
  branch,
  ahead,
  behind,
  isClean,
  dirtyCount,
}: Props) {
  const repoLabel = isRepo
    ? (repoRoot?.split("/").pop() ?? repoRoot)
    : "not a git repo";

  return (
    <footer style={styles.bar}>
      <span style={styles.repo} title={repoRoot ?? ""}>
        {repoLabel}
      </span>
      <span style={styles.sep}>·</span>
      <span style={styles.branch}>{branch ?? "(detached)"}</span>
      <span style={styles.counts}>
        ↑{ahead} ↓{behind}
      </span>
      <span style={styles.spacer} />
      <span style={isClean ? styles.clean : styles.dirty}>
        {isClean ? "clean" : `${dirtyCount} changed`}
      </span>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    background: "#111",
    borderTop: "1px solid #2a2a2a",
    fontSize: 12,
    color: "#bbb",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  repo: { color: "#e6e6e6", fontWeight: 600 },
  sep: { color: "#555" },
  branch: { color: "#7fb3ff" },
  counts: { color: "#888" },
  spacer: { flex: 1 },
  clean: { color: "#5fc26b" },
  dirty: { color: "#e0a64a" },
};
