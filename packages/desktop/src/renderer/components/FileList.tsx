import { useMutation } from "@apollo/client/react/index.js";
import { useMemo, useState } from "react";
import {
  StageFileDocument,
  UnstageFileDocument,
  StageAllDocument,
  UnstageAllDocument,
  StatusDocument,
} from "@opentui-git/client";
import { useToast } from "./Toast.js";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu.js";

type FileStatus = {
  path: string;
  workingDir: string;
  index: string;
  staged: boolean;
  statusText: string;
  color?: string | null;
  hasLocalChanges: boolean | null;
};

type Props = {
  files: FileStatus[];
};

type Section = "staged" | "unstaged";
type RowId = `${Section}:${string}`;

const rowId = (section: Section, path: string): RowId =>
  `${section}:${path}` as RowId;

const DRAG_MIME = "application/x-opentui-rowids";

export function FileList({ files }: Props) {
  const toast = useToast();
  const refetch = [{ query: StatusDocument }];

  const [stageFile] = useMutation(StageFileDocument, {
    refetchQueries: refetch,
  });
  const [unstageFile] = useMutation(UnstageFileDocument, {
    refetchQueries: refetch,
  });
  const [stageAll] = useMutation(StageAllDocument, { refetchQueries: refetch });
  const [unstageAll] = useMutation(UnstageAllDocument, {
    refetchQueries: refetch,
  });

  const [selected, setSelected] = useState<Set<RowId>>(new Set());
  const [lastClicked, setLastClicked] = useState<RowId | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<Section | null>(null);

  const staged = useMemo(() => files.filter((f) => f.staged), [files]);
  const unstaged = useMemo(() => files.filter((f) => !f.staged), [files]);

  const orderedIds = useMemo<RowId[]>(
    () => [
      ...staged.map((f) => rowId("staged", f.path)),
      ...unstaged.map((f) => rowId("unstaged", f.path)),
    ],
    [staged, unstaged],
  );

  const stageMany = async (paths: string[]) => {
    try {
      await Promise.all(
        paths.map((p) => stageFile({ variables: { path: p } })),
      );
    } catch (err) {
      toast.error(`Stage failed: ${(err as Error).message}`);
    }
  };

  const unstageMany = async (paths: string[]) => {
    try {
      await Promise.all(
        paths.map((p) => unstageFile({ variables: { path: p } })),
      );
    } catch (err) {
      toast.error(`Unstage failed: ${(err as Error).message}`);
    }
  };

  const onStageAll = async () => {
    try {
      await stageAll();
      toast.success("Staged all changes");
    } catch (err) {
      toast.error(`Stage all failed: ${(err as Error).message}`);
    }
  };

  const onUnstageAll = async () => {
    try {
      await unstageAll();
      toast.success("Unstaged all changes");
    } catch (err) {
      toast.error(`Unstage all failed: ${(err as Error).message}`);
    }
  };

  const handleClick = (e: React.MouseEvent, id: RowId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && lastClicked) {
        const a = orderedIds.indexOf(lastClicked);
        const b = orderedIds.indexOf(id);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let i = lo; i <= hi; i++) next.add(orderedIds[i]!);
        } else {
          next.add(id);
        }
      } else if (e.metaKey || e.ctrlKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
    setLastClicked(id);
  };

  const idToPath = (id: RowId) => id.slice(id.indexOf(":") + 1);
  const idSection = (id: RowId): Section =>
    id.startsWith("staged:") ? "staged" : "unstaged";

  const selectedInSection = (section: Section): string[] =>
    Array.from(selected)
      .filter((id) => idSection(id) === section)
      .map(idToPath);

  const openContextMenu = (e: React.MouseEvent, id: RowId) => {
    e.preventDefault();
    if (!selected.has(id)) {
      setSelected(new Set([id]));
      setLastClicked(id);
    }
    const section = idSection(id);
    const targets =
      selected.has(id) && selected.size > 1
        ? Array.from(selected)
            .filter((s) => idSection(s) === section)
            .map(idToPath)
        : [idToPath(id)];

    const items: ContextMenuItem[] =
      section === "unstaged"
        ? [
            {
              label:
                targets.length > 1 ? `Stage ${targets.length} files` : "Stage",
              onSelect: () => stageMany(targets),
            },
          ]
        : [
            {
              label:
                targets.length > 1
                  ? `Unstage ${targets.length} files`
                  : "Unstage",
              onSelect: () => unstageMany(targets),
            },
          ];

    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const onDragStart = (e: React.DragEvent, id: RowId) => {
    const ids =
      selected.has(id) && selected.size > 0 ? Array.from(selected) : [id];
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropOnSection = (e: React.DragEvent, target: Section) => {
    e.preventDefault();
    setDropTarget(null);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;
    let ids: RowId[] = [];
    try {
      ids = JSON.parse(raw) as RowId[];
    } catch {
      return;
    }
    const movePaths = ids
      .filter((id) => idSection(id) !== target)
      .map(idToPath);
    if (movePaths.length === 0) return;
    if (target === "staged") stageMany(movePaths);
    else unstageMany(movePaths);
  };

  const onDragOverSection = (e: React.DragEvent, section: Section) => {
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTarget(section);
    }
  };

  const renderSection = (
    section: Section,
    title: string,
    rows: FileStatus[],
    actionLabel: string,
    onAction: () => void,
    rowAction: (path: string) => void,
    rowActionLabel: string,
    emptyText: string,
  ) => {
    const isDropTarget = dropTarget === section;
    return (
      <section
        style={styles.section}
        onDragOver={(e) => onDragOverSection(e, section)}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => onDropOnSection(e, section)}
      >
        <header
          style={{
            ...styles.sectionHeader,
            ...(isDropTarget ? styles.sectionHeaderDrop : {}),
          }}
        >
          <span style={styles.sectionTitle}>
            {title} <span style={styles.sectionCount}>({rows.length})</span>
          </span>
          {rows.length > 0 && (
            <button style={styles.headerBtn} onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </header>
        <ul style={styles.list}>
          {rows.length === 0 ? (
            <li style={styles.empty}>{emptyText}</li>
          ) : (
            rows.map((f) => {
              const id = rowId(section, f.path);
              const isSelected = selected.has(id);
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={(e) => onDragStart(e, id)}
                  onClick={(e) => handleClick(e, id)}
                  onContextMenu={(e) => openContextMenu(e, id)}
                  style={{
                    ...styles.row,
                    ...(isSelected ? styles.rowSelected : {}),
                  }}
                >
                  <code
                    style={{
                      ...styles.statusText,
                      color: f.color ?? "#888",
                    }}
                  >
                    {f.statusText}
                  </code>
                  <span style={styles.path}>{f.path}</span>
                  <button
                    style={styles.rowBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      rowAction(f.path);
                    }}
                  >
                    {rowActionLabel}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    );
  };

  return (
    <div style={styles.wrap}>
      {renderSection(
        "staged",
        "Staged",
        staged,
        "Unstage all",
        onUnstageAll,
        (p) => unstageMany([p]),
        "Unstage",
        "Nothing staged yet · drop here to stage",
      )}
      {renderSection(
        "unstaged",
        "Changes",
        unstaged,
        "Stage all",
        onStageAll,
        (p) => stageMany([p]),
        "Stage",
        "No unstaged changes · drop here to unstage",
      )}
      {selected.size > 0 && (
        <div style={styles.selectionHint}>
          {selectedInSection("unstaged").length > 0 && (
            <button
              style={styles.batchBtn}
              onClick={() => stageMany(selectedInSection("unstaged"))}
            >
              Stage {selectedInSection("unstaged").length} selected
            </button>
          )}
          {selectedInSection("staged").length > 0 && (
            <button
              style={styles.batchBtn}
              onClick={() => unstageMany(selectedInSection("staged"))}
            >
              Unstage {selectedInSection("staged").length} selected
            </button>
          )}
          <button
            style={styles.clearBtn}
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </button>
        </div>
      )}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minHeight: 0,
    paddingBottom: 8,
  },
  section: { display: "flex", flexDirection: "column", minHeight: 0 },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    background: "#1f1f1f",
    borderBottom: "1px solid #2a2a2a",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#888",
    transition: "background 0.1s",
  },
  sectionHeaderDrop: { background: "#2d4a8a", color: "#fff" },
  sectionTitle: { color: "#ccc" },
  sectionCount: { color: "#666" },
  headerBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#ccc",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  list: { listStyle: "none", margin: 0, padding: 0, overflowY: "auto" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 12px",
    fontSize: 13,
    borderBottom: "1px solid #1f1f1f",
    cursor: "pointer",
    userSelect: "none",
  },
  rowSelected: { background: "#1d3358" },
  statusText: {
    width: 24,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontWeight: 600,
  },
  path: {
    flex: 1,
    color: "#e6e6e6",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rowBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#ccc",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    cursor: "pointer",
  },
  empty: {
    padding: "8px 12px",
    color: "#666",
    fontStyle: "italic",
    fontSize: 12,
  },
  selectionHint: {
    display: "flex",
    gap: 8,
    padding: "8px 12px",
    borderTop: "1px solid #2a2a2a",
    background: "#161616",
    flexWrap: "wrap",
  },
  batchBtn: {
    background: "#2d6cdf",
    color: "#fff",
    border: "none",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 4,
    cursor: "pointer",
  },
  clearBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#888",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 4,
    cursor: "pointer",
    marginLeft: "auto",
  },
};
