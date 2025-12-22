import { For, Show, type Accessor, createMemo, createResource } from "solid-js";
import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";

/**
 * DiffViewer component - Displays the diff for a selected file with syntax highlighting
 */
export interface DiffViewerProps {
  diff: Accessor<string | null>;
  filePath: Accessor<string | null>;
  isLoading: Accessor<boolean>;
}

interface DiffLine {
  content: string;
  type: "add" | "remove" | "context" | "header";
  oldLineNum: number | null;
  newLineNum: number | null;
}

interface HighlightedToken {
  text: string;
  color: string;
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

// Initialize Shiki highlighter
async function getHighlighter(): Promise<Highlighter> {
  return createHighlighter({
    themes: ["dark-plus"],
    langs: ["javascript", "typescript", "python", "go", "rust", "c", "cpp", "tsx", "jsx"],
  });
}

// Map file extensions to Shiki languages
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    go: "go",
    rs: "rust",
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return langMap[ext || ""] || "javascript";
}

function parseDiffLines(diff: string): DiffLine[] {
  const lines = diff.split("\n");
  let oldLineNum = 0;
  let newLineNum = 0;

  return lines.map((line) => {
    // Parse @@ header to get line numbers
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        oldLineNum = parseInt(match[1]) - 1;
        newLineNum = parseInt(match[3]) - 1;
      }
      return { content: line, type: "header" as const, oldLineNum: null, newLineNum: null };
    } else if (line.startsWith("+++") || line.startsWith("---")) {
      return { content: line, type: "header" as const, oldLineNum: null, newLineNum: null };
    } else if (line.startsWith("+")) {
      newLineNum++;
      return { content: line.slice(1), type: "add" as const, oldLineNum: null, newLineNum };
    } else if (line.startsWith("-")) {
      oldLineNum++;
      return { content: line.slice(1), type: "remove" as const, oldLineNum, newLineNum: null };
    } else {
      oldLineNum++;
      newLineNum++;
      return { content: line.length > 0 ? line.slice(1) : "", type: "context" as const, oldLineNum, newLineNum };
    }
  });
}

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

function highlightCode(code: string, language: string, highlighter: Highlighter): HighlightedToken[] {
  try {
    // Check if the language is loaded in the highlighter
    const loadedLanguages = highlighter.getLoadedLanguages();
    
    // If the language is not loaded, fall back to plain text
    if (!loadedLanguages.includes(language)) {
      return [{ text: code, color: "#CCCCCC" }];
    }

    // Use the language with proper type - it's validated above
    const tokens = highlighter.codeToTokensBase(code, {
      lang: language as BundledLanguage,
      theme: "dark-plus",
    });

    return tokens[0]?.map((token) => ({
      text: token.content,
      color: token.color || "#CCCCCC",
    })) || [{ text: code, color: "#CCCCCC" }];
  } catch (error) {
    // Log the error to aid in debugging highlighting issues, but still fall back gracefully.
    console.error("Failed to highlight code with shiki highlighter.", {
      language,
      error,
    });
    // Fallback if highlighting fails
    return [{ text: code, color: "#CCCCCC" }];
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
}

function DiffLineView(props: DiffLineViewProps) {
  // For header lines, just render as plain text
  if (props.line.type === "header") {
    return (
      <box
        backgroundColor={getBackgroundColor(props.line.type)}
        width="100%"
        height={1}
        flexDirection="row"
      >
        <box
          backgroundColor={getLineNumberBgColor(props.line.type)}
          width={10}
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
  
  // Format line numbers
  const oldNum = props.line.oldLineNum !== null ? String(props.line.oldLineNum).padStart(4, " ") : "    ";
  const newNum = props.line.newLineNum !== null ? String(props.line.newLineNum).padStart(4, " ") : "    ";

  return (
    <box
      backgroundColor={getBackgroundColor(props.line.type)}
      width="100%"
      height={1}
      flexDirection="row"
    >
      <box
        backgroundColor={getLineNumberBgColor(props.line.type)}
        width={10}
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

  // Memoize getHighlightedTokens function to maintain referential equality
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
      borderColor="#888888"
      width="100%"
      flexGrow={1}
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      overflow="hidden"
    >
      <box flexDirection="row" gap={1} marginBottom={1}>
        <text fg="#AAAAAA">Diff:</text>
        <Show when={props.filePath()} fallback={<text fg="#888888">No file selected</text>}>
          <text fg="#FFFFFF">{props.filePath()}</text>
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
            <For each={diffLines().slice(0, 40)}>
              {(line) => (
                <DiffLineView
                  line={line}
                  language={language()}
                  highlighter={highlighter()}
                  getHighlightedTokens={getHighlightedTokens()}
                />
              )}
            </For>
            <Show when={diffLines().length > 40}>
              <text fg="#888888">... {diffLines().length - 40} more lines (press 'd' to view full diff)</text>
            </Show>
          </box>
        </Show>
      </Show>
    </box>
  );
}
