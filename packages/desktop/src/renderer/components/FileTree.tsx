import { useMutation, useQuery } from "@apollo/client/react/index.js";
import { useMemo, useState } from "react";
import { useSelection, type FileTreeMode } from "../state/selection.js";
import { ChevronDown, ChevronRight } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { buildFileTree, getFilesInFolder } from "opentui-git/shared/file-tree";
import type { GitFileStatus, FileTreeNode } from "opentui-git/git/types";

type Props = {
  files: GitFileStatus[];
};

const REFETCH = [{ query: StatusDocument }];

export function FileTree({ files }: Props) {
  const { mode, setMode, selected, setSelected } = useSelection();

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

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visibleFiles = useMemo<GitFileStatus[]>(() => {
    if (mode === "unstaged") return files.filter((f) => !f.staged);
    if (mode === "staged") return files.filter((f) => f.staged);
    return branchFilesQuery.data?.filesChangedAgainstBranch ?? [];
  }, [mode, files, branchFilesQuery.data]);

  const tree = useMemo(() => buildFileTree(visibleFiles), [visibleFiles]);

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const stagePaths = async (paths: string[]) => {
    if (paths.length === 0) return;
    try {
      await stageFiles({ variables: { paths } });
    } catch (err) {
      toast.error(`Stage failed: ${(err as Error).message}`);
    }
  };

  const unstagePaths = async (paths: string[]) => {
    if (paths.length === 0) return;
    try {
      await unstageFiles({ variables: { paths } });
    } catch (err) {
      toast.error(`Unstage failed: ${(err as Error).message}`);
    }
  };

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

      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            Loading…
          </div>
        ) : visibleFiles.length === 0 ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            {emptyMessage(mode, compareBranch)}
          </div>
        ) : (
          <Tree
            nodes={tree}
            mode={mode}
            collapsed={collapsed}
            onToggleFolder={toggle}
            selected={selected}
            onSelect={setSelected}
            onStage={stagePaths}
            onUnstage={unstagePaths}
          />
        )}
      </ScrollArea>
    </div>
  );
}

function emptyMessage(mode: FileTreeMode, branch: string | null): string {
  if (mode === "unstaged") return "No unstaged changes";
  if (mode === "staged") return "Nothing staged yet";
  return `No changes vs ${branch ?? "main"}`;
}

type TreeProps = {
  nodes: FileTreeNode[];
  mode: FileTreeMode;
  collapsed: Set<string>;
  onToggleFolder: (path: string) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onStage: (paths: string[]) => void;
  onUnstage: (paths: string[]) => void;
};

function Tree(props: TreeProps) {
  const flat = useMemo(
    () => flatten(props.nodes, props.collapsed),
    [props.nodes, props.collapsed],
  );

  return (
    <div className="py-1">
      {flat.map((node) => (
        <Row
          key={node.path}
          node={node}
          isCollapsed={node.type === "folder" && props.collapsed.has(node.path)}
          isSelected={props.selected === node.path}
          onSelect={() => props.onSelect(node.path)}
          onToggle={() => props.onToggleFolder(node.path)}
          onStage={() => {
            const paths =
              node.type === "file" && node.fileStatus
                ? [node.fileStatus.path]
                : getFilesInFolder(node);
            props.onStage(paths);
          }}
          onUnstage={() => {
            const paths =
              node.type === "file" && node.fileStatus
                ? [node.fileStatus.path]
                : getFilesInFolder(node);
            props.onUnstage(paths);
          }}
          mode={props.mode}
        />
      ))}
    </div>
  );
}

function flatten(
  nodes: FileTreeNode[],
  collapsed: Set<string>,
): FileTreeNode[] {
  const out: FileTreeNode[] = [];
  const walk = (ns: FileTreeNode[]) => {
    for (const n of ns) {
      out.push(n);
      if (n.type === "folder" && !collapsed.has(n.path) && n.children) {
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return out;
}

function Row({
  node,
  isCollapsed,
  isSelected,
  onSelect,
  onToggle,
  onStage,
  onUnstage,
  mode,
}: {
  node: FileTreeNode;
  isCollapsed: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onStage: () => void;
  onUnstage: () => void;
  mode: FileTreeMode;
}) {
  const isFolder = node.type === "folder";
  const indent = node.depth * 12;
  const color =
    node.type === "file" && mode === "staged"
      ? "var(--color-git-staged)"
      : (node.color ?? undefined);

  const activate = () => {
    if (isFolder) onToggle();
    else onSelect();
  };

  const inner = (
    <div
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 text-[13px] cursor-pointer select-none font-mono",
        "hover:bg-accent/50",
        isSelected && "bg-accent",
      )}
      style={{ paddingLeft: 8 + indent }}
    >
      {isFolder ? (
        isCollapsed ? (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        )
      ) : (
        <span className="w-3 shrink-0" />
      )}

      <span
        className="truncate flex-1"
        style={{ color: color ?? "var(--color-foreground)" }}
      >
        {node.name}
        {isFolder && "/"}
      </span>
    </div>
  );

  // No staging actions in branch-compare mode.
  if (mode === "branch") return inner;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{inner}</ContextMenuTrigger>
      <ContextMenuContent>
        {mode === "staged" ? (
          <ContextMenuItem onSelect={onUnstage}>
            Unstage{isFolder ? " folder" : ""}
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={onStage}>
            Stage{isFolder ? " folder" : ""}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
