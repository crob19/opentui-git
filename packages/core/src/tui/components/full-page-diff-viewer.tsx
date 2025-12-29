import { For, Show, type Accessor, type Setter, createMemo, createResource, createEffect } from "solid-js";
import type { Highlighter } from "shiki";
import type { GitService } from "../../git/index.js";
import type { DiffMode } from "../../git/types.js";
import { parseSideBySideDiff, parseDiffLines, type DiffRow, type DiffLine } from "../utils/diff-parser.js";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";
import { getLanguageFromPath } from "../utils/language-detection.js";
import { getHighlighter, highlightCode, type HighlightedToken } from "../utils/syntax-highlighting.js";

// Maximum number of diff rows to show at once (virtual scrolling)
const MAX_VISIBLE_ROWS = 30;

// Background color constants
const DIFF_BG_COLOR_ADD = "#1F3F1F";
const DIFF_BG_COLOR_REMOVE = "#3F1F1F";
const DIFF_BG_COLOR_SELECTED = "#444444";

export interface FullPageDiffViewerProps {
  diff: Accessor<string | null>;
  filePath: Accessor<string | null>;
  isLoading: Accessor<boolean>;
  selectedRow: Accessor<number>;
  setSelectedRow: Setter<number>;
  viewMode: Accessor<"unified" | "side-by-side">;
  setViewMode: Setter<"unified" | "side-by-side">;
  diffMode: Accessor<DiffMode>;
  compareBranch: Accessor<string | null>;
  isEditMode: Accessor<boolean>;
  setIsEditMode: Setter<boolean>;
  editedContent: Accessor<string>;
  setEditedContent: Setter<string>;
  editedLines: Accessor<Map<number, string>>;
  setEditedLines: Setter<Map<number, string>>;
  gitService: GitService;
  refetchDiff: () => void;
}

// Background color constants for unified diff
const DIFF_LINE_NUM_BG_COLOR_ADD = "#0F2F0F";
const DIFF_LINE_NUM_BG_COLOR_REMOVE = "#2F0F0F";
const DIFF_LINE_NUM_BG_COLOR_HEADER = "#0F1F2F";
const DIFF_LINE_NUM_BG_COLOR_CONTEXT = "#1A1A1A";

export function FullPageDiffViewer(props: FullPageDiffViewerProps) {
  // Parse diff into rows for side-by-side view
  const diffRows = createMemo(() => {
    const diff = props.diff();
    if (!diff) return [];
    return parseSideBySideDiff(diff);
  });

  // Parse diff lines for unified view
  const diffLines = createMemo(() => {
    const diff = props.diff();
    if (!diff) return [];
    return parseDiffLines(diff);
  });

  // Load highlighter
  const [highlighter] = createResource(getHighlighter);

  // Detect language
  const language = createMemo(() => {
    const path = props.filePath();
    return path ? getLanguageFromPath(path) : "javascript";
  });

  // Virtual scrolling for side-by-side view
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      diffRows(),
      props.selectedRow(),
      MAX_VISIBLE_ROWS,
    ),
  );

  // Virtual scrolling for unified view
  const unifiedScrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      diffLines(),
      props.selectedRow(),
      MAX_VISIBLE_ROWS,
    ),
  );

  // Highlight cache
  const highlightCache = new Map<string, HighlightedToken[]>();
  
  const getHighlightedTokens = (code: string, lang: string, hl: Highlighter | undefined): HighlightedToken[] => {
    if (!hl || code === "") return [{ text: code, color: "#CCCCCC" }];
    
    const cacheKey = `${lang}:${code}`;
    const cached = highlightCache.get(cacheKey);
    if (cached) return cached;
    
    const tokens = highlightCode(code, lang, hl);
    highlightCache.set(cacheKey, tokens);
    return tokens;
  };

  const viewModeLabel = () => props.viewMode() === "side-by-side" ? "Side-by-Side" : "Unified";
  const totalItems = () => props.viewMode() === "side-by-side" ? diffRows().length : diffLines().length;

  // Helper to get diff mode label
  const diffModeLabel = () => {
    const mode = props.diffMode();
    switch (mode) {
      case "unstaged":
        return "Unstaged";
      case "staged":
        return "Staged";
      case "branch":
        return `vs ${props.compareBranch() ?? "main"}`;
      default:
        return "Unknown";
    }
  };

  // Clamp selected row to valid range when total items changes
  createEffect(() => {
    const total = totalItems();
    const current = props.selectedRow();
    if (total > 0 && current >= total) {
      props.setSelectedRow(Math.max(0, total - 1));
    }
  });

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      backgroundColor="#1E1E1E"
    >
      {/* Header */}
      <box
        borderStyle="single"
        borderColor="#00AAFF"
        width="100%"
        height={3}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <box flexDirection="row" gap={1}>
          <text fg="#00AAFF">← Diff:</text>
          <Show when={props.filePath()}>
            <text fg="#FFFFFF">{props.filePath()}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={2}>
          <text fg="#00AAFF">[{diffModeLabel()}]</text>
          <text fg="#666666">Row {props.selectedRow() + 1}/{totalItems()}</text>
          <text fg="#888888">[{viewModeLabel()}]</text>
        </box>
      </box>

      {/* Diff Content */}
      <Show
        when={!props.isLoading() && props.diff()}
        fallback={
          <box flexGrow={1} justifyContent="center" alignItems="center">
            <text fg="#888888">
              {props.isLoading() ? "Loading diff..." : "No changes"}
            </text>
          </box>
        }
      >
        <Show
          when={!highlighter.loading && !highlighter.error}
          fallback={
            <box flexGrow={1} justifyContent="center" alignItems="center">
              <Show
                when={highlighter.error}
                fallback={<text fg="#888888">Loading syntax highlighter...</text>}
              >
                <text fg="#FF5555">Failed to load syntax highlighter</text>
              </Show>
            </box>
          }
        >
          <box flexGrow={1} flexDirection="column" overflow="hidden">
            <Show
              when={props.viewMode() === "side-by-side"}
              fallback={
                <UnifiedDiffView
                  lines={unifiedScrollWindow().visibleItems}
                  scrollStart={unifiedScrollWindow().start}
                  selectedRow={props.selectedRow}
                  language={language()}
                  highlighter={highlighter()}
                  getHighlightedTokens={getHighlightedTokens}
                />
              }
            >
              <SideBySideDiffView
                rows={scrollWindow().visibleItems}
                scrollStart={scrollWindow().start}
                selectedRow={props.selectedRow}
                language={language()}
                highlighter={highlighter()}
                getHighlightedTokens={getHighlightedTokens}
                isEditMode={props.isEditMode}
                editedContent={props.editedContent}
                setEditedContent={props.setEditedContent}
                editedLines={props.editedLines}
              />
            </Show>
          </box>
        </Show>
      </Show>

      {/* Footer */}
      <box
        borderStyle="single"
        borderColor="#444444"
        width="100%"
        height={3}
        paddingLeft={1}
        flexDirection="row"
        alignItems="center"
        gap={2}
      >
        <Show
          when={props.isEditMode()}
          fallback={
            <>
              <text fg="#00AAFF">↑/k</text>
              <text fg="#AAAAAA">up</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">↓/j</text>
              <text fg="#AAAAAA">down</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">Ctrl+T</text>
              <text fg="#AAAAAA">view</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">Ctrl+M</text>
              <text fg="#AAAAAA">diff mode</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">i</text>
              <text fg="#AAAAAA">edit</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">Esc</text>
              <text fg="#AAAAAA">back</text>
              <text fg="#444444">│</text>
              <text fg="#00AAFF">q</text>
              <text fg="#AAAAAA">quit</text>
            </>
          }
        >
          <text fg="#FFAA00">EDIT MODE</text>
          <Show when={props.editedLines().size > 0}>
            <text fg="#444444"> - </text>
            <text fg="#44FF44">{props.editedLines().size} line{props.editedLines().size > 1 ? 's' : ''} edited</text>
          </Show>
          <text fg="#444444">│</text>
          <text fg="#00AAFF">↑/↓</text>
          <text fg="#AAAAAA">navigate</text>
          <text fg="#444444">│</text>
          <text fg="#00AAFF">Ctrl+S</text>
          <text fg="#AAAAAA">save</text>
          <text fg="#444444">│</text>
          <text fg="#00AAFF">Esc</text>
          <text fg="#AAAAAA">cancel</text>
        </Show>
      </box>
    </box>
  );
}

// Side-by-side diff view component
interface SideBySideDiffViewProps {
  rows: DiffRow[];
  scrollStart: number;
  selectedRow: Accessor<number>;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
  isEditMode: Accessor<boolean>;
  editedContent: Accessor<string>;
  setEditedContent: Setter<string>;
  editedLines: Accessor<Map<number, string>>;
}

function SideBySideDiffView(props: SideBySideDiffViewProps) {
  return (
    <box flexDirection="column">
      <For each={props.rows}>
        {(row, index) => {
          const actualIndex = () => props.scrollStart + index();
          const isSelected = () => actualIndex() === props.selectedRow();

          return (
            <DiffRowView
              row={row}
              language={props.language}
              highlighter={props.highlighter}
              getHighlightedTokens={props.getHighlightedTokens}
              isSelected={isSelected()}
              isEditMode={props.isEditMode}
              editedContent={props.editedContent}
              setEditedContent={props.setEditedContent}
              editedLines={props.editedLines}
            />
          );
        }}
      </For>
    </box>
  );
}

// Single row in side-by-side view
interface DiffRowViewProps {
  row: DiffRow;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
  isSelected: boolean;
  isEditMode: Accessor<boolean>;
  editedContent: Accessor<string>;
  setEditedContent: Setter<string>;
  editedLines: Accessor<Map<number, string>>;
}

function DiffRowView(props: DiffRowViewProps) {
  const leftTokens = () => props.getHighlightedTokens(props.row.left, props.language, props.highlighter);
  const rightTokens = () => props.getHighlightedTokens(props.row.right, props.language, props.highlighter);

  // Check if this line has been edited
  const isEdited = () => {
    if (props.row.rightLineNum === null) return false;
    return props.editedLines().has(props.row.rightLineNum);
  };

  const leftBg = () => {
    if (props.isSelected) return DIFF_BG_COLOR_SELECTED;
    if (props.row.type === "removed" || props.row.type === "modified") return DIFF_BG_COLOR_REMOVE;
    return "transparent";
  };

  const rightBg = () => {
    if (props.isSelected) return DIFF_BG_COLOR_SELECTED;
    if (props.row.type === "added" || props.row.type === "modified") return DIFF_BG_COLOR_ADD;
    return "transparent";
  };

  return (
    <box width="100%" height={1} flexDirection="row">
      {/* Left side (old) */}
      <box
        width="50%"
        backgroundColor={leftBg()}
        flexDirection="row"
        paddingLeft={1}
      >
        {/* Line number */}
        <box width={6} paddingRight={1}>
          <Show when={props.row.leftLineNum !== null}>
            <text fg="#666666">{String(props.row.leftLineNum).padStart(4, " ")}</text>
          </Show>
        </box>
        
        {/* Indicator */}
        <box width={2}>
          <Show when={props.row.type === "removed" || props.row.type === "modified"}>
            <text fg="#FF5555">-</text>
          </Show>
        </box>
        
        {/* Content */}
        <box flexGrow={1} flexDirection="row">
          <For each={leftTokens()}>
            {(token) => <text fg={token.color}>{token.text}</text>}
          </For>
        </box>
      </box>

      {/* Divider */}
      <box width={1} backgroundColor="#444444">
        <text fg="#444444">│</text>
      </box>

      {/* Right side (new) */}
      <box
        width="50%"
        backgroundColor={rightBg()}
        flexDirection="row"
        paddingLeft={1}
      >
        {/* Line number */}
        <box width={6} paddingRight={1}>
          <Show when={props.row.rightLineNum !== null}>
            <text fg="#666666">{String(props.row.rightLineNum).padStart(4, " ")}</text>
          </Show>
        </box>

        {/* Indicator */}
        <box width={2}>
          <Show when={isEdited()}>
            <text fg="#FFAA00">*</text>
          </Show>
          <Show when={!isEdited() && (props.row.type === "added" || props.row.type === "modified")}>
            <text fg="#44FF44">+</text>
          </Show>
        </box>

        {/* Content - Show textbox when in edit mode, selected, and on an editable line */}
        <box flexGrow={1} flexDirection="row">
          <Show
            when={props.isEditMode() && props.isSelected && props.row.rightLineNum !== null}
            fallback={
              <Show
                when={isEdited() && props.row.rightLineNum !== null}
                fallback={
                  <For each={rightTokens()}>
                    {(token) => <text fg={token.color}>{token.text}</text>}
                  </For>
                }
              >
                <text fg="#FFFFFF">{props.editedContent()}</text>
              </Show>
            }
          >
            <textbox
              value={props.editedContent()}
              onInput={(newContent: string) => props.setEditedContent(newContent)}
              fg="#FFFFFF"
              bg={rightBg()}
              width="100%"
            />
          </Show>
        </box>
      </box>
    </box>
  );
}

// Unified diff view component
interface UnifiedDiffViewProps {
  lines: DiffLine[];
  scrollStart: number;
  selectedRow: Accessor<number>;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
}

function UnifiedDiffView(props: UnifiedDiffViewProps) {
  // Calculate line number width
  const lineNumberPadding = createMemo(() => {
    let max = 0;
    for (const line of props.lines) {
      if (line.oldLineNum !== null && line.oldLineNum > max) max = line.oldLineNum;
      if (line.newLineNum !== null && line.newLineNum > max) max = line.newLineNum;
    }
    return max > 0 ? Math.max(String(max).length, 4) : 4;
  });

  const lineNumberWidth = createMemo(() => lineNumberPadding() * 2 + 3);

  return (
    <box flexDirection="column">
      <For each={props.lines}>
        {(line, index) => {
          const actualIndex = () => props.scrollStart + index();
          const isSelected = () => actualIndex() === props.selectedRow();
          
          return (
            <UnifiedDiffLineView
              line={line}
              language={props.language}
              highlighter={props.highlighter}
              getHighlightedTokens={props.getHighlightedTokens}
              lineNumberWidth={lineNumberWidth()}
              lineNumberPadding={lineNumberPadding()}
              isSelected={isSelected()}
            />
          );
        }}
      </For>
    </box>
  );
}

// Helper functions for unified view
function getBackgroundColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return DIFF_BG_COLOR_ADD;
    case "remove":
      return DIFF_BG_COLOR_REMOVE;
    case "header":
      return "#1F2F3F";
    case "context":
    default:
      return "transparent";
  }
}

function getLineNumberBgColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return DIFF_LINE_NUM_BG_COLOR_ADD;
    case "remove":
      return DIFF_LINE_NUM_BG_COLOR_REMOVE;
    case "header":
      return DIFF_LINE_NUM_BG_COLOR_HEADER;
    case "context":
    default:
      return DIFF_LINE_NUM_BG_COLOR_CONTEXT;
  }
}

// Single line in unified view
interface UnifiedDiffLineViewProps {
  line: DiffLine;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
  lineNumberWidth: number;
  lineNumberPadding: number;
  isSelected: boolean;
}

function UnifiedDiffLineView(props: UnifiedDiffLineViewProps) {
  const bgColor = () => {
    if (props.isSelected) return DIFF_BG_COLOR_SELECTED;
    return getBackgroundColor(props.line.type);
  };

  // For header lines
  if (props.line.type === "header") {
    return (
      <box
        backgroundColor={bgColor()}
        width="100%"
        height={1}
        flexDirection="row"
      >
        <box
          backgroundColor={getLineNumberBgColor(props.line.type)}
          width={props.lineNumberWidth}
          paddingLeft={1}
          paddingRight={1}
        >
          <text fg="#666666">...</text>
        </box>
        <box paddingLeft={1} flexGrow={1}>
          <text fg="#00AAFF">{props.line.content}</text>
        </box>
      </box>
    );
  }

  const tokens = props.getHighlightedTokens(props.line.content, props.language, props.highlighter);
  const oldNum = props.line.oldLineNum !== null ? String(props.line.oldLineNum).padStart(props.lineNumberPadding, " ") : " ".repeat(props.lineNumberPadding);
  const newNum = props.line.newLineNum !== null ? String(props.line.newLineNum).padStart(props.lineNumberPadding, " ") : " ".repeat(props.lineNumberPadding);

  return (
    <box
      backgroundColor={bgColor()}
      width="100%"
      height={1}
      flexDirection="row"
    >
      <box
        backgroundColor={getLineNumberBgColor(props.line.type)}
        width={props.lineNumberWidth}
        paddingLeft={1}
        paddingRight={1}
        flexDirection="row"
        gap={1}
      >
        <text fg="#666666">{oldNum}</text>
        <text fg="#666666">{newNum}</text>
      </box>
      <box paddingLeft={1} flexGrow={1} flexDirection="row">
        <For each={tokens}>
          {(token) => <text fg={token.color}>{token.text}</text>}
        </For>
      </box>
    </box>
  );
}
