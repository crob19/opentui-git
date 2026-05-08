import { useMutation } from "@apollo/client/react/index.js";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  StageFileDocument,
  UnstageFileDocument,
  StageAllDocument,
  UnstageAllDocument,
  StatusDocument,
} from "@opentui-git/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  buildTree,
  getFilesIn,
  type FileEntry,
  type TreeNode,
} from "@/lib/file-tree";

type Props = {
  files: FileEntry[];
};

const REFETCH = [{ query: StatusDocument }];

export function FileTree({ files }: Props) {
  const [stageFile] = useMutation(StageFileDocument, {
    refetchQueries: REFETCH,
  });
  const [unstageFile] = useMutation(UnstageFileDocument, {
    refetchQueries: REFETCH,
  });
  const [stageAll] = useMutation(StageAllDocument, { refetchQueries: REFETCH });
  const [unstageAll] = useMutation(UnstageAllDocument, {
    refetchQueries: REFETCH,
  });

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  const staged = useMemo(() => files.filter((f) => f.staged), [files]);
  const unstaged = useMemo(() => files.filter((f) => !f.staged), [files]);

  const stagedTree = useMemo(() => buildTree(staged), [staged]);
  const unstagedTree = useMemo(() => buildTree(unstaged), [unstaged]);

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const stagePaths = async (paths: string[]) => {
    try {
      await Promise.all(
        paths.map((p) => stageFile({ variables: { path: p } })),
      );
    } catch (err) {
      toast.error(`Stage failed: ${(err as Error).message}`);
    }
  };

  const unstagePaths = async (paths: string[]) => {
    try {
      await Promise.all(
        paths.map((p) => unstageFile({ variables: { path: p } })),
      );
    } catch (err) {
      toast.error(`Unstage failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <SectionHeader
        title="Staged"
        count={staged.length}
        action={
          staged.length > 0 ? (
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
          ) : null
        }
      />
      <ScrollArea className="flex-1 min-h-[80px]">
        {stagedTree.length === 0 ? (
          <Empty text="Nothing staged yet" />
        ) : (
          <Tree
            nodes={stagedTree}
            section="staged"
            collapsed={collapsed}
            onToggleFolder={toggle}
            selected={selected}
            onSelect={setSelected}
            onStage={stagePaths}
            onUnstage={unstagePaths}
          />
        )}
      </ScrollArea>

      <Separator />

      <SectionHeader
        title="Changes"
        count={unstaged.length}
        action={
          unstaged.length > 0 ? (
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
          ) : null
        }
      />
      <ScrollArea className="flex-1 min-h-[120px]">
        {unstagedTree.length === 0 ? (
          <Empty text="No unstaged changes" />
        ) : (
          <Tree
            nodes={unstagedTree}
            section="unstaged"
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

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
        {title}{" "}
        <span className="text-muted-foreground/60 font-normal">({count})</span>
      </span>
      {action}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
      {text}
    </div>
  );
}

type TreeProps = {
  nodes: TreeNode[];
  section: "staged" | "unstaged";
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
          key={`${props.section}:${node.path}`}
          node={node}
          rowId={`${props.section}:${node.path}`}
          isCollapsed={node.type === "folder" && props.collapsed.has(node.path)}
          isSelected={props.selected === `${props.section}:${node.path}`}
          onSelect={() => props.onSelect(`${props.section}:${node.path}`)}
          onToggle={() => props.onToggleFolder(node.path)}
          onStage={() => {
            const paths =
              node.type === "file"
                ? [node.file.path]
                : getFilesIn(node).map((f) => f.path);
            props.onStage(paths);
          }}
          onUnstage={() => {
            const paths =
              node.type === "file"
                ? [node.file.path]
                : getFilesIn(node).map((f) => f.path);
            props.onUnstage(paths);
          }}
          section={props.section}
        />
      ))}
    </div>
  );
}

function flatten(nodes: TreeNode[], collapsed: Set<string>): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      out.push(n);
      if (n.type === "folder" && !collapsed.has(n.path)) walk(n.children);
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
  section,
}: {
  node: TreeNode;
  rowId: string;
  isCollapsed: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onStage: () => void;
  onUnstage: () => void;
  section: "staged" | "unstaged";
}) {
  const isFolder = node.type === "folder";
  const indent = node.depth * 12;
  const isStaged = section === "staged";

  const color =
    node.type === "file" && isStaged
      ? "var(--color-git-staged)"
      : (node.color ?? undefined);

  const inner = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isFolder) onToggle();
        else onSelect();
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

      {!isFolder && (
        <span
          className="w-5 shrink-0 text-[11px] font-semibold"
          style={{ color: color ?? "var(--color-muted-foreground)" }}
        >
          {node.file.statusText}
        </span>
      )}

      <span
        className="truncate flex-1"
        style={{
          color: isFolder
            ? (color ?? "var(--color-foreground)")
            : (color ?? "var(--color-foreground)"),
        }}
      >
        {node.name}
        {isFolder && "/"}
      </span>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{inner}</ContextMenuTrigger>
      <ContextMenuContent>
        {isStaged ? (
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
