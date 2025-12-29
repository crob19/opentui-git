import { createSignal, createResource, Show } from "solid-js";
import { createClient } from "@opentui-git/sdk";

/**
 * Desktop app for opentui-git
 * Connects to a local or remote opentui-git server
 */
function App() {
  const [serverUrl, setServerUrl] = createSignal("http://localhost:4096");
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Create client when connected
  const client = () => connected() ? createClient(serverUrl()) : null;

  // Fetch status when connected
  const [status] = createResource(
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>opentui-git Desktop</h1>
      
      <Show when={!connected()}>
        <div style={{ "margin-bottom": "20px" }}>
          <label>
            Server URL:
            <input
              type="text"
              value={serverUrl()}
              onInput={(e) => setServerUrl(e.currentTarget.value)}
              style={{
                "margin-left": "10px",
                padding: "8px",
                "border-radius": "4px",
                border: "1px solid #444",
                background: "#2a2a2a",
                color: "#e0e0e0",
                width: "300px"
              }}
            />
          </label>
          <button
            onClick={handleConnect}
            style={{
              "margin-left": "10px",
              padding: "8px 16px",
              "border-radius": "4px",
              border: "none",
              background: "#4a9eff",
              color: "white",
              cursor: "pointer"
            }}
          >
            Connect
          </button>
        </div>
      </Show>

      <Show when={error()}>
        <div style={{ color: "#ff4444", "margin-bottom": "20px" }}>
          Error: {error()}
        </div>
      </Show>

      <Show when={connected() && status()}>
        <div>
          <h2>Connected to {serverUrl()}</h2>
          <div style={{ "margin-bottom": "10px" }}>
            <strong>Branch:</strong> {status()?.current}
          </div>
          <div style={{ "margin-bottom": "10px" }}>
            <strong>Files:</strong> {status()?.files.length || 0} changed
          </div>
          <div style={{ "margin-bottom": "10px" }}>
            <strong>Status:</strong> {status()?.isClean ? "Clean" : "Has changes"}
          </div>
          <button
            onClick={() => setConnected(false)}
            style={{
              padding: "8px 16px",
              "border-radius": "4px",
              border: "1px solid #666",
              background: "transparent",
              color: "#e0e0e0",
              cursor: "pointer"
            }}
          >
            Disconnect
          </button>
        </div>
      </Show>
    </div>
  );
}

export default App;
