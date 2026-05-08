import { useQuery } from "@apollo/client/react/index.js";
import { RepoInfoDocument, StatusDocument } from "@opentui-git/client";
import { StatusBar } from "./components/StatusBar.js";
import { FileTree } from "./components/FileTree.js";
import { CommitPanel } from "./components/CommitPanel.js";
import { ScrollArea } from "@/components/ui/scroll-area";

export function App() {
  const repo = useQuery(RepoInfoDocument);
  const status = useQuery(StatusDocument, { pollInterval: 2000 });

  const files = status.data?.status?.files ?? [];
  const staged = files.filter((f) => f.staged);

  return (
    <div className="dark h-screen w-screen grid grid-cols-[320px_1fr] grid-rows-[1fr_auto] bg-background text-foreground">
      <aside className="col-start-1 row-start-1 border-r border-border bg-card/40 flex flex-col min-h-0 overflow-hidden">
        <FileTree files={files} />
      </aside>

      <main className="col-start-2 row-start-1 flex flex-col min-h-0 overflow-hidden">
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
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
              Diff viewer — Phase 3
            </div>
            <CommitPanel
              stagedCount={staged.length}
              stagedPaths={staged.map((f) => f.path)}
            />
          </>
        )}
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
        />
      </div>
    </div>
  );
}
