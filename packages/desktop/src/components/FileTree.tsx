import { For, Show, type Accessor } from "solid-js";
import type { GitFileStatus, FileTreeNode, DiffMode } from "@opentui-git/core/git/types";
import { STATUS_COLORS } from "@opentui-git/core/git/types";

export interface FileTreeProps {
  files: Accessor<GitFileStatus[]>;
  flatNodes: Accessor<FileTreeNode[]>;
  selectedPath: Accessor<string | null>;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  diffMode: Accessor<DiffMode>;
  compareBranch: Accessor<string | null>;
}

/**
 * Map STATUS_COLORS to Tailwind-compatible style
 */
function getColorStyle(color: string | undefined): string {
  if (!color) return "text-app-text";
  
  switch (color) {
    case STATUS_COLORS.ADDED:
      return "text-git-added";
    case STATUS_COLORS.MODIFIED:
      return "text-git-modified";
    case STATUS_COLORS.DELETED:
      return "text-git-deleted";
    case STATUS_COLORS.UNTRACKED:
      return "text-git-untracked";
    case STATUS_COLORS.RENAMED:
    case STATUS_COLORS.COPIED:
      return "text-git-renamed";
    case STATUS_COLORS.BRANCH_ONLY:
      return "text-git-branch-only";
    default:
      return "text-app-text";
  }
}

/**
 * Get diff mode label for display
 */
function getDiffModeLabel(mode: DiffMode, compareBranch: string | null): string {
  switch (mode) {
    case "unstaged":
      return "Unstaged";
    case "staged":
      return "Staged";
    case "branch":
      return `vs ${compareBranch || "main"}`;
    default:
      return "";
  }
}

/**
 * FileTree component - Displays hierarchical file tree with staging actions
 */
export function FileTree(props: FileTreeProps) {
  const hasFiles = () => props.files().length > 0;
  const hasStagedFiles = () => props.files().some(f => f.staged);
  const hasUnstagedFiles = () => props.files().some(f => !f.staged);

  return (
    <div class="flex flex-col h-full border border-app-border rounded bg-app-surface">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-app-border">
        <div class="flex items-center gap-2">
          <span class="text-app-accent font-medium">Files</span>
          <span class="text-app-text-muted text-sm">({props.files().length})</span>
          <Show when={props.diffMode()}>
            <span class="text-app-text-muted">-</span>
            <span class="text-xs text-app-text-muted">
              {getDiffModeLabel(props.diffMode(), props.compareBranch())}
            </span>
          </Show>
        </div>
        
        {/* Stage All / Unstage All buttons */}
        <div class="flex items-center gap-2">
          <Show when={hasUnstagedFiles()}>
            <button
              onClick={() => props.onStageAll()}
              class="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
              title="Stage all files"
            >
              Stage All
            </button>
          </Show>
          <Show when={hasStagedFiles()}>
            <button
              onClick={() => props.onUnstageAll()}
              class="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              title="Unstage all files"
            >
              Unstage All
            </button>
          </Show>
        </div>
      </div>

      {/* File List */}
      <div class="flex-1 overflow-y-auto scrollbar-thin">
        <Show
          when={hasFiles()}
          fallback={
            <div class="flex items-center justify-center h-full text-app-text-muted text-sm">
              No changes
            </div>
          }
        >
          <For each={props.flatNodes()}>
            {(node) => (
              <FileTreeItem
                node={node}
                isSelected={props.selectedPath() === node.path}
                onSelect={() => props.onSelectFile(node.path)}
                onToggle={() => props.onToggleFolder(node.path)}
                onStage={() => node.fileStatus && props.onStageFile(node.path)}
                onUnstage={() => node.fileStatus && props.onUnstageFile(node.path)}
                diffMode={props.diffMode()}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}

interface FileTreeItemProps {
  node: FileTreeNode;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onStage: () => void;
  onUnstage: () => void;
  diffMode: DiffMode;
}

function FileTreeItem(props: FileTreeItemProps) {
  const isFolder = () => props.node.type === "folder";
  const isFile = () => props.node.type === "file";
  const isStaged = () => props.node.fileStatus?.staged ?? false;
  
  const colorClass = () => {
    // In branch mode, use the color we already set (which considers hasLocalChanges)
    if (props.diffMode === "branch") {
      return getColorStyle(props.node.color);
    }
    // In normal modes, show green for staged files, otherwise status color
    if (isFile() && isStaged()) {
      return "text-git-added";
    }
    return getColorStyle(props.node.color);
  };

  const handleClick = () => {
    if (isFolder()) {
      props.onToggle();
    } else {
      props.onSelect();
    }
  };

  const handleStageClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (isStaged()) {
      props.onUnstage();
    } else {
      props.onStage();
    }
  };

  const indent = () => props.node.depth * 16;

  return (
    <div
      class={`
        flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors
        hover:bg-white/5
        ${props.isSelected ? "bg-white/10" : ""}
      `}
      style={{ "padding-left": `${12 + indent()}px` }}
      onClick={handleClick}
    >
      {/* Folder/File indicator */}
      <Show when={isFolder()}>
        <span class="text-app-text-muted w-4 text-center text-xs">
          {props.node.expanded ? "▼" : "▶"}
        </span>
      </Show>
      <Show when={isFile()}>
        <span class="w-4" /> {/* Spacer for alignment */}
      </Show>

      {/* Name */}
      <span class={`flex-1 truncate font-mono text-sm ${colorClass()}`}>
        {props.node.name}
        <Show when={isFolder()}>/</Show>
      </span>

      {/* Stage/Unstage button for files */}
      <Show when={isFile() && props.node.fileStatus}>
        <button
          onClick={handleStageClick}
          class={`
            text-xs px-2 py-0.5 rounded transition-colors opacity-0 group-hover:opacity-100
            ${isStaged() 
              ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" 
              : "bg-green-900/30 text-green-400 hover:bg-green-900/50"
            }
          `}
          title={isStaged() ? "Unstage file" : "Stage file"}
          style={{ opacity: props.isSelected ? 1 : undefined }}
        >
          {isStaged() ? "-" : "+"}
        </button>
      </Show>

      {/* Status indicator */}
      <Show when={isFile() && props.node.fileStatus}>
        <span class={`text-xs font-mono ${colorClass()}`}>
          {props.node.fileStatus?.statusText?.charAt(0) ?? ""}
        </span>
      </Show>
    </div>
  );
}
