import { useQuery } from "@apollo/client/react/index.js";
import { RepoInfoDocument, StatusDocument } from "@opentui-git/client";

export function App() {
  const repo = useQuery(RepoInfoDocument);
  const status = useQuery(StatusDocument, { pollInterval: 2000 });

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>opentui-git</h1>
        {repo.data?.repoInfo && (
          <span style={styles.repoPath}>
            {repo.data.repoInfo.isRepo
              ? repo.data.repoInfo.repoRoot
              : "not a git repo"}
          </span>
        )}
      </header>

      <section>
        <h2 style={styles.sectionHeader}>Status</h2>
        {status.loading && !status.data && <p>Loading…</p>}
        {status.error && (
          <pre style={styles.error}>{String(status.error.message)}</pre>
        )}
        {status.data?.status && (
          <>
            <p style={styles.branchLine}>
              <strong>{status.data.status.current ?? "(detached)"}</strong>
              {"  "}↑{status.data.status.ahead} ↓{status.data.status.behind}
              {status.data.status.isClean ? "  (clean)" : ""}
            </p>
            <ul style={styles.fileList}>
              {status.data.status.files.map((f) => (
                <li key={f.path} style={{ color: f.color ?? undefined }}>
                  <code>{f.statusText}</code> {f.path}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    padding: "1.5rem",
    color: "#e6e6e6",
    background: "#1a1a1a",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  title: { fontSize: "1.25rem", margin: 0 },
  repoPath: { color: "#888", fontSize: "0.85rem" },
  sectionHeader: {
    fontSize: "0.85rem",
    textTransform: "uppercase",
    color: "#888",
    margin: "0 0 0.5rem",
  },
  branchLine: { margin: "0 0 0.75rem" },
  fileList: { listStyle: "none", padding: 0, margin: 0, lineHeight: 1.6 },
  error: { color: "#ff6b6b" },
};
