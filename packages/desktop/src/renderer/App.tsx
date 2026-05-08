import { useQuery } from "@apollo/client/react/index.js";
import { RepoInfoDocument, StatusDocument } from "@opentui-git/client";
import { StatusBar } from "./components/StatusBar.js";
import { FileList } from "./components/FileList.js";
import { CommitPanel } from "./components/CommitPanel.js";

export function App() {
  const repo = useQuery(RepoInfoDocument);
  const status = useQuery(StatusDocument, { pollInterval: 2000 });

  const files = status.data?.status?.files ?? [];
  const staged = files.filter((f) => f.staged);

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarSection}>
          <div style={styles.sidebarHeader}>Branches</div>
          <div style={styles.placeholder}>Phase 2</div>
        </div>
        <div style={styles.sidebarSection}>
          <div style={styles.sidebarHeader}>Tags</div>
          <div style={styles.placeholder}>Phase 2</div>
        </div>
      </aside>

      <main style={styles.main}>
        {status.loading && !status.data && (
          <div style={styles.center}>Loading…</div>
        )}
        {status.error && (
          <pre style={styles.error}>{String(status.error.message)}</pre>
        )}
        {status.data?.status && (
          <>
            <div style={styles.fileArea}>
              <FileList files={files} />
            </div>
            <CommitPanel
              stagedCount={staged.length}
              stagedPaths={staged.map((f) => f.path)}
            />
          </>
        )}
      </main>

      <div style={styles.statusBarSlot}>
        <StatusBar
          repoRoot={repo.data?.repoInfo?.repoRoot}
          isRepo={repo.data?.repoInfo?.isRepo}
          branch={status.data?.status?.current}
          ahead={status.data?.status?.ahead ?? 0}
          behind={status.data?.status?.behind ?? 0}
          isClean={status.data?.status?.isClean ?? true}
          dirtyCount={files.length}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gridTemplateRows: "1fr auto",
    gridTemplateAreas: `
      "sidebar main"
      "statusbar statusbar"
    `,
    height: "100vh",
    width: "100vw",
    background: "#1a1a1a",
    color: "#e6e6e6",
    fontFamily:
      "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sidebar: {
    gridArea: "sidebar",
    background: "#141414",
    borderRight: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  sidebarSection: { padding: "8px 0" },
  sidebarHeader: {
    padding: "6px 12px",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#888",
  },
  placeholder: {
    padding: "4px 12px",
    fontSize: 11,
    color: "#555",
    fontStyle: "italic",
  },
  main: {
    gridArea: "main",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  fileArea: { flex: 1, overflowY: "auto", minHeight: 0 },
  center: { padding: 24, color: "#888" },
  error: {
    padding: 16,
    color: "#ff6b6b",
    whiteSpace: "pre-wrap",
    fontFamily: "ui-monospace, monospace",
  },
  statusBarSlot: { gridArea: "statusbar" },
};
