import { useQuery } from "@apollo/client/react/index.js";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RepoTreeDocument, type RepoTreeQuery } from "@opentui-git/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSelection } from "../state/selection.js";

type Entry = RepoTreeQuery["repoTree"][number];

export function RepoTree() {
  return (
    <ScrollArea className="h-full">
      <div className="py-1 text-sm">
        <Directory path={null} depth={0} />
      </div>
    </ScrollArea>
  );
}

function Directory({ path, depth }: { path: string | null; depth: number }) {
  const { data, loading, error } = useQuery(RepoTreeDocument, {
    variables: { path },
  });

  if (loading && !data) {
    return (
      <Row depth={depth} muted>
        Loading…
      </Row>
    );
  }
  if (error) {
    return (
      <Row depth={depth} muted>
        {error.message}
      </Row>
    );
  }
  const entries = data?.repoTree ?? [];
  if (entries.length === 0) {
    return (
      <Row depth={depth} muted>
        (empty)
      </Row>
    );
  }

  return (
    <>
      {entries.map((entry) =>
        entry.type === "DIR" ? (
          <DirNode key={entry.path} entry={entry} depth={depth} />
        ) : (
          <FileNode key={entry.path} entry={entry} depth={depth} />
        ),
      )}
    </>
  );
}

function DirNode({ entry, depth }: { entry: Entry; depth: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-0.5 text-left hover:bg-accent/40"
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {open && <Directory path={entry.path} depth={depth + 1} />}
    </>
  );
}

function FileNode({ entry, depth }: { entry: Entry; depth: number }) {
  const { selected, kind, setSelected } = useSelection();
  const active = kind === "view" && selected === entry.path;
  return (
    <button
      type="button"
      onClick={() => setSelected(entry.path, "view")}
      className={cn(
        "flex w-full items-center gap-1 px-2 py-0.5 text-left hover:bg-accent/40",
        active && "bg-accent/60",
      )}
      style={{ paddingLeft: 8 + depth * 12 + 14 }}
    >
      <span className="truncate">{entry.name}</span>
    </button>
  );
}

function Row({
  depth,
  muted,
  children,
}: {
  depth: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-2 py-0.5 text-xs italic",
        muted && "text-muted-foreground/60",
      )}
      style={{ paddingLeft: 8 + depth * 12 + 14 }}
    >
      {children}
    </div>
  );
}
