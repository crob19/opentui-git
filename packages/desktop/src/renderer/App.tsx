import { useQuery } from "@apollo/client/react/index.js";
import { useState } from "react";
import { ApolloProvider } from "@apollo/client/react/index.js";
import { RepoInfoDocument, StatusDocument } from "@opentui-git/client";
import { StatusBar } from "./components/StatusBar.js";
import { DiffViewer } from "./components/DiffViewer.js";
import { FileViewer } from "./components/FileViewer.js";
import { FileTabs } from "./components/FileTabs.js";
import { TerminalTab } from "./components/TerminalTab.js";
import {
  isFileTab,
  SelectionProvider,
  useSelection,
} from "./state/selection.js";
import { RepositorySidebar } from "./components/RepositorySidebar.js";
import { TerminalPanel } from "./components/TerminalPanel.js";
import { ProjectTabBar } from "./components/ProjectTabBar.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjects, type ProjectClient } from "./state/projects.js";

function MainPane({ cwd }: { cwd: string }) {
  const { activeTab } = useSelection();

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Select a file to open a tab
      </div>
    );
  }

  if (!isFileTab(activeTab)) {
    return <TerminalTab cwd={cwd} />;
  }

  return activeTab.kind === "view" ? (
    <FileViewer tab={activeTab} />
  ) : (
    <DiffViewer tab={activeTab} />
  );
}

function ProjectWorkspace({ project }: { project: ProjectClient }) {
  const repo = useQuery(RepoInfoDocument);
  const status = useQuery(StatusDocument, { pollInterval: 2000 });
  const [terminalOpen, setTerminalOpen] = useState(false);
  const { openTerminalTab } = useSelection();

  const files = status.data?.status?.files ?? [];
  const staged = files.filter((f) => f.staged);

  return (
    <div
      className="flex-1 min-h-0 grid grid-cols-[320px_1fr] grid-rows-[1fr_auto] text-foreground"
      style={{ background: "var(--window)" }}
    >
      <aside
        className="col-start-1 row-start-1 hairline-r flex flex-col min-h-0 overflow-hidden"
        style={{ background: "var(--sidebar)" }}
      >
        <RepositorySidebar
          files={files}
          stagedCount={staged.length}
          stagedPaths={staged.map((f) => f.path)}
        />
      </aside>

      <main className="col-start-2 row-start-1 flex flex-col min-h-0 overflow-hidden">
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{ background: "var(--code)" }}
        >
          {status.loading && !status.data && (
            <div className="p-6 text-muted-foreground">Loading…</div>
          )}
          {status.error && (
            <ScrollArea className="flex-1">
              <pre className="p-4 text-destructive whitespace-pre-wrap font-mono text-sm">
                {String(status.error.message)}
              </pre>
            </ScrollArea>
          )}
          {status.data?.status && (
            <>
              <FileTabs cwd={project.path} />
              <MainPane cwd={project.path} />
            </>
          )}
        </div>
        <TerminalPanel
          visible={terminalOpen}
          cwd={project.path}
          onOpenAsTab={() => {
            openTerminalTab();
            setTerminalOpen(false);
          }}
        />
      </main>

      <div className="col-span-2 row-start-2">
        <StatusBar
          repoRoot={repo.data?.repoInfo?.repoRoot}
          isRepo={repo.data?.repoInfo?.isRepo}
          branch={status.data?.status?.current}
          ahead={status.data?.status?.ahead ?? 0}
          behind={status.data?.status?.behind ?? 0}
          isClean={status.data?.status?.isClean ?? true}
          dirtyCount={files.length}
          terminalOpen={terminalOpen}
          onToggleTerminal={() => setTerminalOpen((v) => !v)}
        />
      </div>
    </div>
  );
}

export function App() {
  const { projects, activeId } = useProjects();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <ProjectTabBar />
      {projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
          No project open — use the + button to open one.
        </div>
      ) : (
        projects.map((p) => (
          <div
            key={p.id}
            className="flex-1 min-h-0 flex flex-col"
            style={{ display: p.id === activeId ? "flex" : "none" }}
          >
            <ApolloProvider client={p.client}>
              <SelectionProvider>
                <ProjectWorkspace project={p} />
              </SelectionProvider>
            </ApolloProvider>
          </div>
        ))
      )}
    </div>
  );
}
