/**
 * Tree builder mirroring the TUI's file panel structure
 * (packages/core/src/tui/utils/file-tree.ts). Inlined here rather than
 * shared so the desktop doesn't depend on the Solid TUI package.
 */

export type FileEntry = {
  path: string;
  staged: boolean;
  statusText: string;
  color?: string | null;
};

export type FileNode = {
  type: "file";
  name: string;
  path: string;
  depth: number;
  file: FileEntry;
  color?: string | null;
};

export type FolderNode = {
  type: "folder";
  name: string;
  path: string;
  depth: number;
  children: TreeNode[];
  color?: string | null;
};

export type TreeNode = FileNode | FolderNode;

const STATUS_PRIORITY: readonly string[] = [
  "#888888", // branch only / dim
  "#AAAAAA", // untracked
  "#FFFF44", // modified (yellow)
  "#44FF44", // added (green)
  "#4488FF", // renamed/copied (blue)
  "#FF44FF", // unmerged (magenta)
  "#FF4444", // deleted (red)
];

function highestPriorityColor(
  colors: (string | null | undefined)[],
): string | undefined {
  let best = -1;
  let result: string | undefined;
  for (const c of colors) {
    if (!c) continue;
    const p = STATUS_PRIORITY.indexOf(c);
    if (p > best) {
      best = p;
      result = c;
    }
  }
  return result;
}

export function buildTree(files: FileEntry[]): TreeNode[] {
  type Builder = TreeNode & { _map?: Map<string, Builder> };

  const root = new Map<string, Builder>();
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split("/");
    let map = root;
    let acc = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const last = i === parts.length - 1;
      acc = acc ? `${acc}/${part}` : part;

      if (last) {
        const node: Builder = {
          type: "file",
          name: part,
          path: acc,
          depth: i,
          file,
          color: file.color,
        };
        map.set(part, node);
      } else {
        let folder = map.get(part);
        if (!folder) {
          folder = {
            type: "folder",
            name: part,
            path: acc,
            depth: i,
            children: [],
            _map: new Map(),
          } as Builder;
          map.set(part, folder);
        }
        if (folder.type !== "folder") break;
        if (!folder._map) folder._map = new Map();
        map = folder._map;
      }
    }
  }

  const finalize = (m: Map<string, Builder>): TreeNode[] =>
    Array.from(m.values()).map((n) => {
      if (n.type === "folder") {
        const children = n._map ? finalize(n._map) : [];
        const color = highestPriorityColor(children.map((c) => c.color));
        return {
          type: "folder",
          name: n.name,
          path: n.path,
          depth: n.depth,
          children,
          color,
        };
      }
      return {
        type: "file",
        name: n.name,
        path: n.path,
        depth: n.depth,
        file: n.file,
        color: n.color,
      };
    });

  return finalize(root);
}

export function getFilesIn(node: TreeNode): FileEntry[] {
  const out: FileEntry[] = [];
  const walk = (n: TreeNode) => {
    if (n.type === "file") out.push(n.file);
    else for (const c of n.children) walk(c);
  };
  walk(node);
  return out;
}
