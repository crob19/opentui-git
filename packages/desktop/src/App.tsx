import { createSignal, createResource, onMount, Show, For } from "solid-js";
import { createClient, type GitClient } from "@opentui-git/sdk";

/**
 * Desktop app for opentui-git
 * Connects to the automatically spawned opentui-git server
 */
function App() {
  const [serverUrl, setServerUrl] = createSignal("http://localhost:5050");
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [checkingOut, setCheckingOut] = createSignal<string | null>(null);

  // Create client when connected
  const client = (): GitClient | null => connected() ? createClient(serverUrl()) : null;

  // Auto-connect on mount using injected port from Tauri
  onMount(async () => {
    const tauriConfig = (window as Window).__OPENTUI__;
    if (tauriConfig?.port) {
      const url = `http://127.0.0.1:${tauriConfig.port}`;
      console.log("[app] Using Tauri-injected port:", tauriConfig.port);
      setServerUrl(url);
    }
    
    // Auto-connect after a brief delay to let server start
    setTimeout(async () => {
      await handleConnect();
    }, 100);

    // Add hover effect styles (done in onMount to ensure we're in browser environment)
    const style = document.createElement("style");
    style.textContent = `
      li[style*="cursor: pointer"]:hover {
        background-color: #333 !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Fetch status when connected
  const [status, { refetch: refetchStatus }] = createResource(
    () => client(),
    async (c) => {
      if (!c) return null;
      try {
        const status = await c.getStatus();
        setError(null);
        return status;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed");
        setConnected(false);
        return null;
      }
    }
  );

  // Fetch branches when connected
  const [branches, { refetch: refetchBranches }] = createResource(
    () => client(),
    async (c) => {
      if (!c) return null;
      try {
        return await c.getBranches();
      } catch (e) {
        console.error("Failed to fetch branches:", e);
        return null;
      }
    }
  );

  const handleConnect = async () => {
    try {
      const testClient = createClient(serverUrl());
      await testClient.health();
      setConnected(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  };

  const handleCheckout = async (branchName: string) => {
    const c = client();
    if (!c || checkingOut()) return;

    setCheckingOut(branchName);
    setError(null);

    try {
      await c.checkoutBranch(branchName);
      // Refresh status and branches
      await Promise.all([refetchStatus(), refetchBranches()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to checkout ${branchName}`);
    } finally {
      setCheckingOut(null);
    }
  };

  // Separate local and remote branches
  const localBranches = () => {
    const b = branches();
    if (!b) return [];
    return b.all.filter(name => !name.startsWith("remotes/"));
  };

  const remoteBranches = () => {
    const b = branches();
    if (!b) return [];
    return b.all
      .filter(name => name.startsWith("remotes/"))
      .map(name => name.replace("remotes/", ""));
  };

  const currentBranch = () => status()?.current || branches()?.current;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>opentui-git</h1>
        <Show when={connected()}>
          <span style={styles.connectionBadge}>Connected</span>
        </Show>
      </header>

      <Show when={error()}>
        <div style={styles.errorBanner}>
          {error()}
        </div>
      </Show>

      <Show when={!connected()}>
        <div style={styles.connectPanel}>
          <p style={styles.connectText}>Connecting to server...</p>
          <div style={styles.connectForm}>
            <input
              type="text"
              value={serverUrl()}
              onInput={(e) => setServerUrl(e.currentTarget.value)}
              style={styles.input}
              placeholder="Server URL"
            />
            <button onClick={handleConnect} style={styles.button}>
              Connect
            </button>
          </div>
        </div>
      </Show>

      <Show when={connected() && status()}>
        <main style={styles.main}>
          {/* Repository Info */}
          <section style={styles.section}>
            <div style={styles.repoInfo}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Repository:</span>
                <span style={styles.value}>
                  {(window as Window).__OPENTUI__?.repoPath || "Unknown"}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Status:</span>
                <span style={styles.value}>
                  {status()?.isClean 
                    ? "Clean" 
                    : `${status()?.files.length || 0} files changed`
                  }
                </span>
              </div>
            </div>
          </section>

          {/* Current Branch */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Current Branch</h2>
            <div style={styles.currentBranch}>
              <span style={styles.branchIcon}>*</span>
              <span style={styles.currentBranchName}>{currentBranch()}</span>
            </div>
          </section>

          {/* Local Branches */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Local Branches</h2>
            <ul style={styles.branchList}>
              <For each={localBranches()}>
                {(branch) => (
                  <li 
                    style={{
                      ...styles.branchItem,
                      ...(branch === currentBranch() ? styles.branchItemCurrent : {}),
                      ...(checkingOut() === branch ? styles.branchItemLoading : {}),
                    }}
                    onClick={() => branch !== currentBranch() && handleCheckout(branch)}
                  >
                    <span style={styles.branchBullet}>
                      {branch === currentBranch() ? ">" : " "}
                    </span>
                    <span style={styles.branchName}>{branch}</span>
                    <Show when={checkingOut() === branch}>
                      <span style={styles.loadingText}>switching...</span>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </section>

          {/* Remote Branches */}
          <Show when={remoteBranches().length > 0}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Remote Branches</h2>
              <ul style={styles.branchList}>
                <For each={remoteBranches()}>
                  {(branch) => (
                    <li style={styles.branchItemRemote}>
                      <span style={styles.branchBullet}>-</span>
                      <span style={styles.branchName}>{branch}</span>
                    </li>
                  )}
                </For>
              </ul>
            </section>
          </Show>
        </main>
      </Show>
    </div>
  );
}

// Inline styles for the app
const styles: Record<string, any> = {
  container: {
    "min-height": "100vh",
    "background-color": "#1a1a1a",
    color: "#e0e0e0",
    "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    "align-items": "center",
    "justify-content": "space-between",
    padding: "16px 24px",
    "border-bottom": "1px solid #333",
    "background-color": "#242424",
  },
  title: {
    margin: 0,
    "font-size": "20px",
    "font-weight": 600,
  },
  connectionBadge: {
    "font-size": "12px",
    padding: "4px 8px",
    "border-radius": "4px",
    "background-color": "#2d5a3d",
    color: "#7fff9c",
  },
  errorBanner: {
    padding: "12px 24px",
    "background-color": "#5a2d2d",
    color: "#ff7f7f",
    "font-size": "14px",
  },
  connectPanel: {
    padding: "40px 24px",
    "text-align": "center",
  },
  connectText: {
    "margin-bottom": "20px",
    color: "#888",
  },
  connectForm: {
    display: "flex",
    "justify-content": "center",
    gap: "10px",
  },
  input: {
    padding: "10px 14px",
    "border-radius": "6px",
    border: "1px solid #444",
    background: "#2a2a2a",
    color: "#e0e0e0",
    width: "300px",
    "font-size": "14px",
  },
  button: {
    padding: "10px 20px",
    "border-radius": "6px",
    border: "none",
    background: "#4a9eff",
    color: "white",
    cursor: "pointer",
    "font-size": "14px",
    "font-weight": 500,
  },
  main: {
    padding: "20px 24px",
  },
  section: {
    "margin-bottom": "24px",
  },
  sectionTitle: {
    "font-size": "12px",
    "font-weight": 600,
    "text-transform": "uppercase",
    "letter-spacing": "0.5px",
    color: "#888",
    "margin-bottom": "12px",
  },
  repoInfo: {
    "background-color": "#242424",
    "border-radius": "8px",
    padding: "16px",
  },
  infoRow: {
    display: "flex",
    "margin-bottom": "8px",
  },
  label: {
    width: "100px",
    color: "#888",
    "font-size": "14px",
  },
  value: {
    color: "#e0e0e0",
    "font-size": "14px",
    "word-break": "break-all",
  },
  currentBranch: {
    display: "flex",
    "align-items": "center",
    gap: "10px",
    padding: "14px 16px",
    "background-color": "#2d4a5a",
    "border-radius": "8px",
    "border-left": "3px solid #4a9eff",
  },
  branchIcon: {
    color: "#4a9eff",
    "font-size": "16px",
  },
  currentBranchName: {
    "font-size": "16px",
    "font-weight": 500,
  },
  branchList: {
    "list-style": "none",
    margin: 0,
    padding: 0,
  },
  branchItem: {
    display: "flex",
    "align-items": "center",
    gap: "10px",
    padding: "10px 16px",
    "border-radius": "6px",
    cursor: "pointer",
    transition: "background-color 0.15s",
    "background-color": "transparent",
  },
  branchItemCurrent: {
    "background-color": "#2d4a5a",
    cursor: "default",
  },
  branchItemLoading: {
    opacity: 0.6,
    cursor: "wait",
  },
  branchItemRemote: {
    display: "flex",
    "align-items": "center",
    gap: "10px",
    padding: "8px 16px",
    color: "#888",
    "font-size": "14px",
  },
  branchBullet: {
    width: "16px",
    "text-align": "center",
    color: "#666",
    "font-family": "monospace",
  },
  branchName: {
    "font-size": "14px",
  },
  loadingText: {
    "font-size": "12px",
    color: "#888",
    "font-style": "italic",
  },
};

export default App;
