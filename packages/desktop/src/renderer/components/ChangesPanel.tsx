import { useMutation, useQuery } from "@apollo/client/react/index.js";
import { useEffect, useMemo, useRef } from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import { toast } from "sonner";
import {
  StageFilesDocument,
  UnstageFilesDocument,
  StageAllDocument,
  UnstageAllDocument,
  StatusDocument,
  DefaultBranchDocument,
  FilesChangedAgainstBranchDocument,
} from "@opentui-git/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSelection, type FileTreeMode } from "../state/selection.js";
import { toGitStatusEntries } from "../lib/gitStatusAdapter.js";
import type { FileStatus as GitFileStatus } from "@opentui-git/client";

type Props = {
  files: GitFileStatus[];
};

const REFETCH = [{ query: StatusDocument }];

export function ChangesPanel({ files }: Props) {
  const { mode, setMode, openTab } = useSelection();

  const defaultBranchQuery = useQuery(DefaultBranchDocument, {
    skip: mode !== "branch",
  });
  const compareBranch = defaultBranchQuery.data?.defaultBranch ?? null;

  const branchFilesQuery = useQuery(FilesChangedAgainstBranchDocument, {
    variables: { branch: compareBranch ?? "" },
    skip: mode !== "branch" || !compareBranch,
  });

  const [stageFiles] = useMutation(StageFilesDocument, {
    refetchQueries: REFETCH,
  });
  const [unstageFiles] = useMutation(UnstageFilesDocument, {
    refetchQueries: REFETCH,
  });
  const [stageAll] = useMutation(StageAllDocument, { refetchQueries: REFETCH });
  const [unstageAll] = useMutation(UnstageAllDocument, {
    refetchQueries: REFETCH,
  });

  const visibleFiles = useMemo<GitFileStatus[]>(() => {
    if (mode === "unstaged") return files.filter((f) => !f.staged);
    if (mode === "staged") return files.filter((f) => f.staged);
    return branchFilesQuery.data?.filesChangedAgainstBranch ?? [];
  }, [mode, files, branchFilesQuery.data]);

  const paths = useMemo(() => visibleFiles.map((f) => f.path), [visibleFiles]);
  const gitStatus = useMemo(
    () =>
      toGitStatusEntries(
        visibleFiles,
        mode === "staged"
          ? "index"
          : mode === "unstaged"
            ? "working"
            : "either",
      ),
    [visibleFiles, mode],
  );

  const stagePaths = async (pathsToStage: string[]) => {
    if (pathsToStage.length === 0) return;
    try {
      await stageFiles({ variables: { paths: pathsToStage } });
    } catch (err) {
      toast.error(`Stage failed: ${(err as Error).message}`);
    }
  };

  const unstagePaths = async (pathsToUnstage: string[]) => {
    if (pathsToUnstage.length === 0) return;
    try {
      await unstageFiles({ variables: { paths: pathsToUnstage } });
    } catch (err) {
      toast.error(`Unstage failed: ${(err as Error).message}`);
    }
  };

  const pathsUnderFolder = (folder: string): string[] => {
    const prefix = folder.endsWith("/") ? folder : `${folder}/`;
    return paths.filter((p) => p.startsWith(prefix));
  };

  // pierre/trees' useFileTree builds the model once at mount and captures the
  // initial onSelectionChange closure, so its `mode`/`paths`/`openTab` would be
  // frozen to the first render. Read everything through a ref that we refresh
  // each render. Revisit if pierre/trees exposes a callback setter.
  const latest = useRef({ mode, compareBranch, paths, openTab });
  latest.current = { mode, compareBranch, paths, openTab };

  const { model } = useFileTree({
    paths,
    gitStatus,
    flattenEmptyDirectories: false,
    initialExpansion: "open",
    onSelectionChange: (selected) => {
      const path = selected[0];
      if (!path) return;
      const cur = latest.current;
      if (!cur.paths.includes(path)) return;
      cur.openTab({
        path,
        kind: "diff",
        mode: cur.mode,
        compareBranch: cur.mode === "branch" ? cur.compareBranch : null,
      });
    },
  });

  useEffect(() => {
    model.resetPaths(paths);
  }, [model, paths]);

  useEffect(() => {
    model.setGitStatus(gitStatus);
  }, [model, gitStatus]);

  const isLoading =
    mode === "branch" &&
    (defaultBranchQuery.loading ||
      (branchFilesQuery.loading && !branchFilesQuery.data));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 pt-2 pb-1 border-b border-border">
        <Tabs value={mode} onValueChange={(v) => setMode(v as FileTreeMode)}>
          <TabsList className="w-full grid grid-cols-3 h-7">
            <TabsTrigger value="unstaged" className="text-[11px]">
              Unstaged
            </TabsTrigger>
            <TabsTrigger value="staged" className="text-[11px]">
              Staged
            </TabsTrigger>
            <TabsTrigger value="branch" className="text-[11px]">
              vs {compareBranch ?? "main"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {mode === "unstaged" && "Changes"}
          {mode === "staged" && "Staged"}
          {mode === "branch" && `vs ${compareBranch ?? "main"}`}
          <span className="ml-1.5 text-muted-foreground/60 font-normal">
            ({visibleFiles.length})
          </span>
        </span>
        {mode === "unstaged" && visibleFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px]"
            onClick={async () => {
              try {
                await stageAll();
                toast.success("Staged all changes");
              } catch (err) {
                toast.error(`Stage all failed: ${(err as Error).message}`);
              }
            }}
          >
            Stage all
          </Button>
        )}
        {mode === "staged" && visibleFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px]"
            onClick={async () => {
              try {
                await unstageAll();
                toast.success("Unstaged all changes");
              } catch (err) {
                toast.error(`Unstage all failed: ${(err as Error).message}`);
              }
            }}
          >
            Unstage all
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-[var(--dracula-bg)]">
        {isLoading ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            Loading…
          </div>
        ) : visibleFiles.length === 0 ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            {emptyMessage(mode, compareBranch)}
          </div>
        ) : (
          <FileTree
            model={model}
            className="h-full"
            renderContextMenu={(item) => {
              if (mode === "branch") return null;
              const isFolder = item.kind === "directory";
              const targetPaths = isFolder
                ? pathsUnderFolder(item.path)
                : [item.path];
              return (
                <ContextMenu>
                  <ContextMenuTrigger />
                  <ContextMenuContent>
                    {mode === "staged" ? (
                      <ContextMenuItem
                        onSelect={() => unstagePaths(targetPaths)}
                      >
                        Unstage{isFolder ? " folder" : ""}
                      </ContextMenuItem>
                    ) : (
                      <ContextMenuItem onSelect={() => stagePaths(targetPaths)}>
                        Stage{isFolder ? " folder" : ""}
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

function emptyMessage(mode: FileTreeMode, branch: string | null): string {
  if (mode === "unstaged") return "No unstaged changes";
  if (mode === "staged") return "Nothing staged yet";
  return `No changes vs ${branch ?? "main"}`;
}
