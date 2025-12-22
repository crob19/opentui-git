import { For, Show, type Accessor, createMemo, createResource } from "solid-js";
import { createHighlighter, type Highlighter } from "shiki";

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

// Initialize Shiki highlighter
let highlighterInstance: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ["dark-plus"],
      langs: ["javascript", "typescript", "python", "go", "rust", "c", "cpp", "tsx", "jsx"],
    });
  }
  return highlighterInstance;
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
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        oldLineNum = parseInt(match[1]) - 1;
        newLineNum = parseInt(match[2]) - 1;
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
      return { content: line.slice(1) || line, type: "context" as const, oldLineNum, newLineNum };
    }
  });
}

function getBackgroundColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "#1F3F1F"; // Dark green background
    case "remove":
      return "#3F1F1F"; // Dark red background
    case "header":
      return "#1F2F3F"; // Dark blue background
    case "context":
    default:
      return "transparent";
  }
}

function getLineNumberBgColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "#0F2F0F"; // Darker green
    case "remove":
      return "#2F0F0F"; // Darker red
    case "header":
      return "#0F1F2F"; // Darker blue
    case "context":
    default:
      return "#1A1A1A"; // Dark gray
  }
}

function highlightCode(code: string, language: string, highlighter: Highlighter): HighlightedToken[] {
  try {
    const tokens = highlighter.codeToTokensBase(code, {
      lang: language as any,
      theme: "dark-plus",
    });

    return tokens[0]?.map((token) => ({
      text: token.content,
      color: token.color || "#CCCCCC",
    })) || [{ text: code, color: "#CCCCCC" }];
  } catch (error) {
    // Fallback if highlighting fails
    return [{ text: code, color: "#CCCCCC" }];
  }
}

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

  // Render a single diff line with syntax highlighting
  const renderDiffLine = (line: DiffLine) => {
    const hl = highlighter();
    
    // For header lines, just render as plain text
    if (line.type === "header") {
      return (
        <box
          backgroundColor={getBackgroundColor(line.type)}
          width="100%"
          height={1}
          flexDirection="row"
        >
          <box
            backgroundColor={getLineNumberBgColor(line.type)}
            width={10}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg="#666666">...</text>
          </box>
          <box paddingLeft={1} flexGrow={1}>
            <text fg="#00AAFF">{line.content.slice(0, 100)}</text>
          </box>
        </box>
      );
    }

    // Get highlighted tokens
    const tokens = hl ? highlightCode(line.content, language(), hl) : [{ text: line.content, color: "#CCCCCC" }];
    
    // Format line numbers
    const oldNum = line.oldLineNum !== null ? String(line.oldLineNum).padStart(4, " ") : "    ";
    const newNum = line.newLineNum !== null ? String(line.newLineNum).padStart(4, " ") : "    ";

    return (
      <box
        backgroundColor={getBackgroundColor(line.type)}
        width="100%"
        height={1}
        flexDirection="row"
      >
        <box
          backgroundColor={getLineNumberBgColor(line.type)}
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
          <For each={tokens.slice(0, 20)}>
            {(token) => <text fg={token.color}>{token.text}</text>}
          </For>
        </box>
      </box>
    );
  };

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
        <Show when={!highlighter.loading} fallback={<text fg="#888888">Loading syntax highlighter...</text>}>
          <box flexDirection="column" overflow="hidden">
            <For each={diffLines().slice(0, 40)}>
              {(line) => renderDiffLine(line)}
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
