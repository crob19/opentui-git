import { createSignal, createResource, Show, onMount, onCleanup } from "solid-js";
import { createClient, type GitClient } from "@opentui-git/sdk";
import type { DiffMode } from "@opentui-git/core/git/types";
import { Header } from "./components/Header.js";
import { FileTree } from "./components/FileTree.js";
import { BranchList } from "./components/BranchList.js";
import { DiffViewer } from "./components/DiffViewer.js";
import { useGitStatus, useGitDiff } from "./hooks/index.js";

/**
 * Desktop app for opentui-git
 * Three-panel layout with file tree, branches, and diff viewer
 */
function App() {
  const [serverUrl, setServerUrl] = createSignal("http://localhost:5050");
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [repoPath, setRepoPath] = createSignal("");
  const [checkingOut, setCheckingOut] = createSignal<string | null>(null);

  // Diff display settings
  const [viewMode, setViewMode] = createSignal<"unified" | "side-by-side">("side-by-side");
  const [diffMode, setDiffMode] = createSignal<DiffMode>("unstaged");
  const [compareBranch, setCompareBranch] = createSignal<string | null>(null);

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
    if (tauriConfig?.repoPath) {
      setRepoPath(tauriConfig.repoPath);
    }
    
    // Auto-connect after a brief delay to let server start
    setTimeout(async () => {
      await handleConnect();
    }, 100);
  });

  const handleConnect = async () => {
    try {
      const testClient = createClient(serverUrl());
      await testClient.health();
      setConnected(true);
      setError(null);
      
      // Initialize compare branch to default branch
      try {
        const defaultBranch = await testClient.getDefaultBranch();
        setCompareBranch(defaultBranch);
      } catch {
        setCompareBranch("main");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  };

  return (
    <Show
      when={connected() && client()}
      fallback={<ConnectPanel serverUrl={serverUrl} setServerUrl={setServerUrl} onConnect={handleConnect} error={error} />}
    >
      {(c) => (
        <AppContent 
          client={c()} 
          repoPath={repoPath}
          viewMode={viewMode}
          setViewMode={setViewMode}
          diffMode={diffMode}
          setDiffMode={setDiffMode}
          compareBranch={compareBranch}
          checkingOut={checkingOut}
          setCheckingOut={setCheckingOut}
          setError={setError}
          error={error}
        />
      )}
    </Show>
  );
}

interface AppContentProps {
  client: GitClient;
  repoPath: () => string;
  viewMode: () => "unified" | "side-by-side";
  setViewMode: (mode: "unified" | "side-by-side") => void;
  diffMode: () => DiffMode;
  setDiffMode: (mode: DiffMode) => void;
  compareBranch: () => string | null;
  checkingOut: () => string | null;
  setCheckingOut: (branch: string | null) => void;
  setError: (error: string | null) => void;
  error: () => string | null;
}

function AppContent(props: AppContentProps) {
  const { client } = props;

  // Git status hook
  const gitStatus = useGitStatus(client, props.diffMode, props.compareBranch);

  // Git diff hook
  const gitDiff = useGitDiff(client, gitStatus.selectedFile, props.diffMode, props.compareBranch);

  // Fetch branches
  const [branches, { refetch: refetchBranches }] = createResource(
    () => true,
    async () => {
      try {
        return await client.getBranches();
      } catch (e) {
        console.error("Failed to fetch branches:", e);
        return null;
      }
    }
  );

  const localBranches = () => {
    const b = branches();
    if (!b) return [];
    return b.all.filter(name => !name.startsWith("remotes/"));
  };

  const currentBranch = () => gitStatus.gitStatus()?.current || branches()?.current || "";

  // Auto-refresh every 2 seconds
  onMount(() => {
    const interval = setInterval(() => {
      gitStatus.refetch();
      refetchBranches();
    }, 2000);
    onCleanup(() => clearInterval(interval));
  });

  // Staging actions
  const handleStageFile = async (path: string) => {
    try {
      await client.stageFile(path);
      gitStatus.refetch();
    } catch (e) {
      props.setError(e instanceof Error ? e.message : "Failed to stage file");
    }
  };

  const handleUnstageFile = async (path: string) => {
    try {
      await client.unstageFile(path);
      gitStatus.refetch();
    } catch (e) {
      props.setError(e instanceof Error ? e.message : "Failed to unstage file");
    }
  };

  const handleStageAll = async () => {
    try {
      await client.stageAll();
      gitStatus.refetch();
    } catch (e) {
      props.setError(e instanceof Error ? e.message : "Failed to stage all files");
    }
  };

  const handleUnstageAll = async () => {
    try {
      await client.unstageAll();
      gitStatus.refetch();
    } catch (e) {
      props.setError(e instanceof Error ? e.message : "Failed to unstage all files");
    }
  };

  // Branch checkout
  const handleCheckout = async (branchName: string) => {
    if (props.checkingOut()) return;

    props.setCheckingOut(branchName);
    props.setError(null);

    try {
      await client.checkoutBranch(branchName);
      await Promise.all([gitStatus.refetch(), refetchBranches()]);
    } catch (e) {
      props.setError(e instanceof Error ? e.message : `Failed to checkout ${branchName}`);
    } finally {
      props.setCheckingOut(null);
    }
  };

  // File selection
  const handleSelectFile = (path: string) => {
    gitStatus.setSelectedPath(path);
  };

  return (
    <div class="flex flex-col h-screen bg-app-bg">
      {/* Header */}
      <Header
        status={() => gitStatus.gitStatus() ?? null}
        repoPath={props.repoPath}
        connected={() => true}
      />

      {/* Error Banner */}
      <Show when={props.error()}>
        <div class="px-6 py-3 bg-red-900/50 text-red-400 text-sm">
          {props.error()}
        </div>
      </Show>

      {/* Main Content */}
      <Show
        when={gitStatus.isGitRepo() && !gitStatus.errorMessage()}
        fallback={
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="text-red-400 text-lg mb-2">Error</div>
              <div class="text-app-text-muted">{gitStatus.errorMessage() || "Not a git repository"}</div>
            </div>
          </div>
        }
      >
        <div class="flex-1 flex overflow-hidden p-4 gap-4">
          {/* Left Panel - Files and Branches */}
          <div class="w-[30%] flex flex-col gap-4">
            {/* Files Panel - 60% height */}
            <div class="flex-[6]">
              <FileTree
                files={() => gitStatus.gitStatus()?.files || []}
                flatNodes={gitStatus.flatNodes}
                selectedPath={gitStatus.selectedPath}
                onSelectFile={handleSelectFile}
                onToggleFolder={gitStatus.toggleFolderExpand}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
                diffMode={props.diffMode}
                compareBranch={props.compareBranch}
              />
            </div>

            {/* Branches Panel - 40% height */}
            <div class="flex-[4]">
              <BranchList
                branches={localBranches}
                currentBranch={currentBranch}
                onCheckout={handleCheckout}
                checkingOut={props.checkingOut}
              />
            </div>
          </div>

          {/* Right Panel - Diff Viewer */}
          <div class="flex-1">
            <DiffViewer
              diff={() => gitDiff.diffContent() ?? null}
              filePath={gitStatus.selectedPath}
              isLoading={gitDiff.isLoading}
              viewMode={props.viewMode}
              onViewModeChange={props.setViewMode}
              diffMode={props.diffMode}
              onDiffModeChange={props.setDiffMode}
              compareBranch={props.compareBranch}
            />
          </div>
        </div>
      </Show>
    </div>
  );
}

interface ConnectPanelProps {
  serverUrl: () => string;
  setServerUrl: (url: string) => void;
  onConnect: () => void;
  error: () => string | null;
}

function ConnectPanel(props: ConnectPanelProps) {
  return (
    <div class="flex flex-col items-center justify-center h-screen bg-app-bg">
      <h1 class="text-2xl font-semibold text-app-text mb-8">opentui-git</h1>
      
      <Show when={props.error()}>
        <div class="mb-4 px-4 py-2 bg-red-900/50 text-red-400 rounded text-sm">
          {props.error()}
        </div>
      </Show>

      <p class="text-app-text-muted mb-6">Connecting to server...</p>
      
      <div class="flex gap-3">
        <input
          type="text"
          value={props.serverUrl()}
          onInput={(e) => props.setServerUrl(e.currentTarget.value)}
          class="px-4 py-2 rounded-lg border border-app-border bg-app-surface text-app-text w-[300px] focus:outline-none focus:border-app-accent"
          placeholder="Server URL"
        />
        <button
          onClick={props.onConnect}
          class="px-5 py-2 rounded-lg bg-app-accent text-white font-medium hover:bg-app-accent/80 transition-colors"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

export default App;
