import { For, Show, type Accessor, type Setter, createMemo, createResource } from "solid-js";
import type { Highlighter } from "shiki";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";
import { getLanguageFromPath } from "../utils/language-detection.js";
import { parseDiffLines, type DiffLine } from "../utils/diff-parser.js";
import { getHighlighter, highlightCode, type HighlightedToken } from "../utils/syntax-highlighting.js";

/**
 * DiffViewer component - Displays the diff for a selected file with syntax highlighting
 */
export interface DiffViewerProps {
  diff: Accessor<string | null>;
  filePath: Accessor<string | null>;
  isLoading: Accessor<boolean>;
  isActive: Accessor<boolean>;
  selectedLine: Accessor<number>;
  setSelectedLine: Setter<number>;
}

// Background color constants for diff lines
const DIFF_BG_COLOR_ADD = "#1F3F1F"; // Dark green background
const DIFF_BG_COLOR_REMOVE = "#3F1F1F"; // Dark red background
const DIFF_BG_COLOR_HEADER = "#1F2F3F"; // Dark blue background
const DIFF_BG_COLOR_CONTEXT = "transparent";

// Line number background color constants for diff lines
const DIFF_LINE_NUM_BG_COLOR_ADD = "#0F2F0F"; // Darker green
const DIFF_LINE_NUM_BG_COLOR_REMOVE = "#2F0F0F"; // Darker red
const DIFF_LINE_NUM_BG_COLOR_HEADER = "#0F1F2F"; // Darker blue
const DIFF_LINE_NUM_BG_COLOR_CONTEXT = "#1A1A1A"; // Dark gray

function getBackgroundColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return DIFF_BG_COLOR_ADD;
    case "remove":
      return DIFF_BG_COLOR_REMOVE;
    case "header":
      return DIFF_BG_COLOR_HEADER;
    case "context":
    default:
      return DIFF_BG_COLOR_CONTEXT;
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

/**
 * DiffLineView - Separate component to render a single diff line
 * Helps keep the code organized and enables granular reactivity for each diff line
 */
interface DiffLineViewProps {
  line: DiffLine;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
  lineNumberWidth: number;
  lineNumberPadding: number;
  isSelected: boolean;
  isActive: boolean;
}

function DiffLineView(props: DiffLineViewProps) {
  // Determine background color based on selection and line type
  const bgColor = () => {
    if (props.isSelected && props.isActive) {
      return "#444444"; // Highlighted when selected and panel is active
    }
    return getBackgroundColor(props.line.type);
  };

  // For header lines, just render as plain text
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

  // Get highlighted tokens (memoized)
  const tokens = props.getHighlightedTokens(props.line.content, props.language, props.highlighter);
  
  // Format line numbers with dynamic padding
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

// Memoize highlighted tokens to avoid re-highlighting the same lines
// Moved outside component to persist across renders
const highlightCache = new Map<string, HighlightedToken[]>();

// Maximum number of diff lines to show at once in the virtual scroll window
const MAX_VISIBLE_DIFF_LINES = 35;

export function DiffViewer(props: DiffViewerProps) {
  const diffLines = () => {
    const diff = props.diff();
    if (!diff) return [];
    return parseDiffLines(diff);
  };

  // Load highlighter as a resource
  const [highlighter] = createResource(getHighlighter);

  const language = createMemo(() => {
    const path = props.filePath();
    return path ? getLanguageFromPath(path) : "javascript";
  });

  // Calculate visible window of diff lines to show (virtual scrolling)
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      diffLines(),
      props.selectedLine(),
      MAX_VISIBLE_DIFF_LINES,
    ),
  );


  // Calculate the maximum line number to determine width needed
  const maxLineNumber = createMemo(() => {
    const lines = diffLines();
    let max = 0;
    for (const line of lines) {
      if (line.oldLineNum !== null && line.oldLineNum > max) {
        max = line.oldLineNum;
      }
      if (line.newLineNum !== null && line.newLineNum > max) {
        max = line.newLineNum;
      }
    }
    return max;
  });

  // Calculate line number padding (number of digits needed)
  const lineNumberPadding = createMemo(() => {
    const max = maxLineNumber();
    return max > 0 ? Math.max(String(max).length, 4) : 4; // minimum 4 for readability
  });

  // Calculate total width for line number column
  // Formula: padding * 2 (for old and new line numbers) + 3 (2 for paddingLeft/paddingRight + 1 for gap)
  const lineNumberWidth = createMemo(() => {
    return lineNumberPadding() * 2 + 3;
  });

  // Memoize getHighlightedTokens function to maintain referential equality
  // Uses module-level highlightCache (line 229) that persists across renders
  const getHighlightedTokens = createMemo(() => {
    return (code: string, lang: string, hl: Highlighter | undefined): HighlightedToken[] => {
      if (!hl) return [{ text: code, color: "#CCCCCC" }];
      
      const cacheKey = `${lang}:${code}`;
      const cached = highlightCache.get(cacheKey);
      if (cached) return cached;
      
      const tokens = highlightCode(code, lang, hl);
      highlightCache.set(cacheKey, tokens);
      return tokens;
    };
  });

  return (
    <box
      borderStyle="single"
      borderColor={props.isActive() ? "#00AAFF" : "#888888"}
      width="100%"
      flexGrow={1}
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      overflow="hidden"
    >
      <box flexDirection="row" gap={1} marginBottom={1} justifyContent="space-between">
        <box flexDirection="row" gap={1}>
          <text fg="#AAAAAA">Diff:</text>
          <Show when={props.filePath()} fallback={<text fg="#888888">No file selected</text>}>
            <text fg="#FFFFFF">{props.filePath()}</text>
          </Show>
        </box>
        <Show when={diffLines().length > 0}>
          <text fg="#666666">Line {props.selectedLine() + 1}/{diffLines().length}</text>
        </Show>
      </box>

      <Show when={props.isLoading()}>
        <text fg="#888888">Loading diff...</text>
      </Show>

      <Show when={!props.isLoading() && !props.diff() && props.filePath()}>
        <text fg="#888888">No changes to display</text>
      </Show>

      <Show when={!props.isLoading() && props.diff()}>
        <Show
          when={!highlighter.loading && !highlighter.error}
          fallback={
            <Show
              when={highlighter.error}
              fallback={<text fg="#888888">Loading syntax highlighter...</text>}
            >
              <text fg="#FF5555">Failed to load syntax highlighter</text>
            </Show>
          }
        >
          <box flexDirection="column" overflow="hidden">
            <For each={scrollWindow().visibleItems}>
              {(line, index) => {
                const actualIndex = () => scrollWindow().start + index();
                const isSelected = () => actualIndex() === props.selectedLine();
                
                return (
                  <DiffLineView
                    line={line}
                    language={language()}
                    highlighter={highlighter()}
                    lineNumberWidth={lineNumberWidth()}
                    lineNumberPadding={lineNumberPadding()}
                    getHighlightedTokens={getHighlightedTokens()}
                    isSelected={isSelected()}
                    isActive={props.isActive()}
                  />
                );
              }}
            </For>
          </box>
        </Show>
      </Show>
    </box>
  );
}
