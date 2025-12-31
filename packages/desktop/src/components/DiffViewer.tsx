import { For, Show, createMemo, createResource, type Accessor } from "solid-js";
import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";
import type { DiffMode } from "@opentui-git/core/git/types";
import { parseDiffLines, parseSideBySideDiff, type DiffLine, type DiffRow } from "@opentui-git/core/utils/diff-parser";
import { getLanguageFromPath } from "@opentui-git/core/utils/language-detection";

export interface DiffViewerProps {
  diff: Accessor<string | null>;
  filePath: Accessor<string | null>;
  isLoading: Accessor<boolean>;
  viewMode: Accessor<"unified" | "side-by-side">;
  onViewModeChange: (mode: "unified" | "side-by-side") => void;
  diffMode: Accessor<DiffMode>;
  onDiffModeChange: (mode: DiffMode) => void;
  compareBranch: Accessor<string | null>;
}

/**
 * Token with syntax highlighting info
 */
interface HighlightedToken {
  text: string;
  color: string;
}

/**
 * Initialize Shiki highlighter
 */
async function getShikiHighlighter(): Promise<Highlighter> {
  return createHighlighter({
    themes: ["dark-plus"],
    langs: ["javascript", "typescript", "python", "go", "rust", "c", "cpp", "tsx", "jsx", "json", "html", "css", "markdown", "yaml", "toml", "shell"],
  });
}

/**
 * Highlight code using Shiki
 */
function highlightCode(code: string, language: string, highlighter: Highlighter): HighlightedToken[] {
  try {
    const loadedLanguages = highlighter.getLoadedLanguages();
    if (!loadedLanguages.includes(language)) {
      return [{ text: code, color: "#CCCCCC" }];
    }

    const tokens = highlighter.codeToTokensBase(code, {
      lang: language as BundledLanguage,
      theme: "dark-plus",
    });

    return tokens[0]?.map((token) => ({
      text: token.content,
      color: token.color || "#CCCCCC",
    })) || [{ text: code, color: "#CCCCCC" }];
  } catch {
    return [{ text: code, color: "#CCCCCC" }];
  }
}

// Cache for highlighted tokens with size limit to prevent memory leaks
const MAX_CACHE_SIZE = 1000;
const highlightCache = new Map<string, HighlightedToken[]>();

function getCachedHighlight(code: string, lang: string, hl: Highlighter | undefined): HighlightedToken[] {
  if (!hl || code === "") return [{ text: code, color: "#CCCCCC" }];
  
  const cacheKey = `${lang}:${code}`;
  const cached = highlightCache.get(cacheKey);
  if (cached) return cached;
  
  const tokens = highlightCode(code, lang, hl);
  
  // Implement cache size limit with simple eviction
  if (highlightCache.size >= MAX_CACHE_SIZE) {
    // Clear half the cache when limit is reached
    const entries = Array.from(highlightCache.entries());
    highlightCache.clear();
    // Keep the more recent half
    entries.slice(Math.floor(entries.length / 2)).forEach(([key, value]) => {
      highlightCache.set(key, value);
    });
  }
  
  highlightCache.set(cacheKey, tokens);
  return tokens;
}

/**
 * Get diff mode label
 */
function getDiffModeLabel(mode: DiffMode, compareBranch: string | null): string {
  switch (mode) {
    case "unstaged": return "Unstaged";
    case "staged": return "Staged";
    case "branch": return `vs ${compareBranch || "main"}`;
  }
}

/**
 * DiffViewer component - Displays unified or side-by-side diff with syntax highlighting
 */
export function DiffViewer(props: DiffViewerProps) {
  // Load highlighter
  const [highlighter] = createResource(getShikiHighlighter);

  // Parse diff based on view mode
  const diffLines = createMemo(() => {
    const diff = props.diff();
    if (!diff) return [];
    return parseDiffLines(diff);
  });

  const diffRows = createMemo(() => {
    const diff = props.diff();
    if (!diff) return [];
    return parseSideBySideDiff(diff);
  });

  // Detect language
  const language = createMemo(() => {
    const path = props.filePath();
    return path ? getLanguageFromPath(path) : "javascript";
  });

  const totalLines = () => props.viewMode() === "unified" ? diffLines().length : diffRows().length;

  const cycleDiffMode = () => {
    const current = props.diffMode();
    const next = current === "unstaged" ? "staged" : current === "staged" ? "branch" : "unstaged";
    props.onDiffModeChange(next);
  };

  // Computed states for cleaner conditionals
  const hasDiff = () => {
    const diff = props.diff();
    return diff !== null && diff !== undefined && diff.length > 0;
  };
  const hasFile = () => props.filePath() !== null;
  const isReady = () => !props.isLoading() && !highlighter.loading && highlighter() !== undefined;

  return (
    <div class="flex flex-col h-full border border-app-border rounded bg-app-surface">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-app-border">
        <div class="flex items-center gap-3">
          <span class="text-app-accent font-medium">Diff</span>
          <Show when={props.filePath()}>
            <span class="text-app-text font-mono text-sm truncate max-w-[300px]">
              {props.filePath()}
            </span>
          </Show>
        </div>

        <div class="flex items-center gap-3">
          {/* Diff mode selector */}
          <button
            onClick={cycleDiffMode}
            class="text-xs px-2 py-1 rounded bg-app-accent/20 text-app-accent hover:bg-app-accent/30 transition-colors"
            title="Toggle diff mode (Ctrl+M)"
          >
            {getDiffModeLabel(props.diffMode(), props.compareBranch())}
          </button>

          {/* View mode toggle */}
          <div class="flex rounded overflow-hidden border border-app-border">
            <button
              onClick={() => props.onViewModeChange("unified")}
              class={`text-xs px-2 py-1 transition-colors ${
                props.viewMode() === "unified"
                  ? "bg-app-accent text-white"
                  : "bg-app-surface text-app-text-muted hover:bg-white/5"
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => props.onViewModeChange("side-by-side")}
              class={`text-xs px-2 py-1 transition-colors ${
                props.viewMode() === "side-by-side"
                  ? "bg-app-accent text-white"
                  : "bg-app-surface text-app-text-muted hover:bg-white/5"
              }`}
            >
              Split
            </button>
          </div>

          {/* Line count */}
          <Show when={totalLines() > 0}>
            <span class="text-xs text-app-text-muted">
              {totalLines()} lines
            </span>
          </Show>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto scrollbar-thin font-mono text-sm">
        {/* Loading state */}
        <Show when={props.isLoading()}>
          <div class="flex items-center justify-center h-full text-app-text-muted">
            Loading diff...
          </div>
        </Show>

        {/* No file selected */}
        <Show when={!props.isLoading() && !hasFile()}>
          <div class="flex items-center justify-center h-full text-app-text-muted">
            Select a file to view diff
          </div>
        </Show>

        {/* File selected but no diff (or empty diff) */}
        <Show when={!props.isLoading() && hasFile() && !hasDiff()}>
          <div class="flex items-center justify-center h-full text-app-text-muted">
            No changes to display
          </div>
        </Show>

        {/* Highlighter loading */}
        <Show when={!props.isLoading() && hasDiff() && highlighter.loading}>
          <div class="flex items-center justify-center h-full text-app-text-muted">
            Loading syntax highlighter...
          </div>
        </Show>

        {/* Ready to render diff */}
        <Show when={isReady() && hasDiff()}>
          <Show
            when={props.viewMode() === "unified"}
            fallback={
              <SideBySideDiffView
                rows={diffRows()}
                language={language()}
                highlighter={highlighter()}
              />
            }
          >
            <UnifiedDiffView
              lines={diffLines()}
              language={language()}
              highlighter={highlighter()}
            />
          </Show>
        </Show>
      </div>
    </div>
  );
}

// ============================================================================
// Unified Diff View
// ============================================================================

interface UnifiedDiffViewProps {
  lines: DiffLine[];
  language: string;
  highlighter: Highlighter | undefined;
}

function UnifiedDiffView(props: UnifiedDiffViewProps) {
  // Calculate max line number for padding
  const lineNumberPadding = createMemo(() => {
    let max = 0;
    for (const line of props.lines) {
      if (line.oldLineNum !== null && line.oldLineNum > max) max = line.oldLineNum;
      if (line.newLineNum !== null && line.newLineNum > max) max = line.newLineNum;
    }
    return max > 0 ? Math.max(String(max).length, 4) : 4;
  });

  return (
    <div class="min-w-max">
      <For each={props.lines}>
        {(line) => (
          <UnifiedDiffLine
            line={line}
            language={props.language}
            highlighter={props.highlighter}
            lineNumberPadding={lineNumberPadding()}
          />
        )}
      </For>
    </div>
  );
}

interface UnifiedDiffLineProps {
  line: DiffLine;
  language: string;
  highlighter: Highlighter | undefined;
  lineNumberPadding: number;
}

function UnifiedDiffLine(props: UnifiedDiffLineProps) {
  const bgClass = () => {
    switch (props.line.type) {
      case "add": return "bg-diff-add-bg";
      case "remove": return "bg-diff-remove-bg";
      case "header": return "bg-diff-header-bg";
      default: return "";
    }
  };

  const lineNumBgClass = () => {
    switch (props.line.type) {
      case "add": return "bg-diff-add-linenum-bg";
      case "remove": return "bg-diff-remove-linenum-bg";
      case "header": return "bg-diff-header-linenum-bg";
      default: return "bg-diff-context-linenum-bg";
    }
  };

  // For header lines, show simple text
  if (props.line.type === "header") {
    return (
      <div class={`flex ${bgClass()}`}>
        <div class={`${lineNumBgClass()} px-2 py-0.5 text-app-text-muted select-none min-w-[80px]`}>
          ...
        </div>
        <div class="px-2 py-0.5 text-app-accent flex-1">
          {props.line.content}
        </div>
      </div>
    );
  }

  const tokens = () => getCachedHighlight(props.line.content, props.language, props.highlighter);
  const oldNum = () => props.line.oldLineNum !== null 
    ? String(props.line.oldLineNum).padStart(props.lineNumberPadding, " ") 
    : " ".repeat(props.lineNumberPadding);
  const newNum = () => props.line.newLineNum !== null 
    ? String(props.line.newLineNum).padStart(props.lineNumberPadding, " ") 
    : " ".repeat(props.lineNumberPadding);

  return (
    <div class={`flex ${bgClass()}`}>
      {/* Line numbers */}
      <div class={`${lineNumBgClass()} px-2 py-0.5 text-app-text-muted select-none flex gap-2 min-w-[80px]`}>
        <span>{oldNum()}</span>
        <span>{newNum()}</span>
      </div>
      
      {/* Content */}
      <div class="px-2 py-0.5 flex-1 whitespace-pre">
        <For each={tokens()}>
          {(token) => <span style={{ color: token.color }}>{token.text}</span>}
        </For>
      </div>
    </div>
  );
}

// ============================================================================
// Side-by-Side Diff View
// ============================================================================

interface SideBySideDiffViewProps {
  rows: DiffRow[];
  language: string;
  highlighter: Highlighter | undefined;
}

function SideBySideDiffView(props: SideBySideDiffViewProps) {
  return (
    <div class="min-w-max">
      <For each={props.rows}>
        {(row) => (
          <SideBySideDiffRow
            row={row}
            language={props.language}
            highlighter={props.highlighter}
          />
        )}
      </For>
    </div>
  );
}

interface SideBySideDiffRowProps {
  row: DiffRow;
  language: string;
  highlighter: Highlighter | undefined;
}

function SideBySideDiffRow(props: SideBySideDiffRowProps) {
  const leftTokens = () => getCachedHighlight(props.row.left, props.language, props.highlighter);
  const rightTokens = () => getCachedHighlight(props.row.right, props.language, props.highlighter);

  const leftBgClass = () => {
    if (props.row.type === "removed" || props.row.type === "modified") return "bg-diff-remove-bg";
    return "";
  };

  const rightBgClass = () => {
    if (props.row.type === "added" || props.row.type === "modified") return "bg-diff-add-bg";
    return "";
  };

  return (
    <div class="flex">
      {/* Left side (old) */}
      <div class={`flex-1 flex border-r border-app-border ${leftBgClass()}`}>
        {/* Line number */}
        <div class="bg-diff-context-linenum-bg px-2 py-0.5 text-app-text-muted select-none min-w-[50px] text-right">
          {props.row.leftLineNum ?? ""}
        </div>
        
        {/* Indicator */}
        <div class="w-6 px-1 py-0.5 text-center">
          <Show when={props.row.type === "removed" || props.row.type === "modified"}>
            <span class="text-git-deleted">-</span>
          </Show>
        </div>
        
        {/* Content */}
        <div class="px-2 py-0.5 flex-1 whitespace-pre">
          <For each={leftTokens()}>
            {(token) => <span style={{ color: token.color }}>{token.text}</span>}
          </For>
        </div>
      </div>

      {/* Right side (new) */}
      <div class={`flex-1 flex ${rightBgClass()}`}>
        {/* Line number */}
        <div class="bg-diff-context-linenum-bg px-2 py-0.5 text-app-text-muted select-none min-w-[50px] text-right">
          {props.row.rightLineNum ?? ""}
        </div>
        
        {/* Indicator */}
        <div class="w-6 px-1 py-0.5 text-center">
          <Show when={props.row.type === "added" || props.row.type === "modified"}>
            <span class="text-git-added">+</span>
          </Show>
        </div>
        
        {/* Content */}
        <div class="px-2 py-0.5 flex-1 whitespace-pre">
          <For each={rightTokens()}>
            {(token) => <span style={{ color: token.color }}>{token.text}</span>}
          </For>
        </div>
      </div>
    </div>
  );
}
