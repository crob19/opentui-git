import { For, Show, type Accessor, type Setter, createMemo, createResource, createEffect, onCleanup } from "solid-js";
import type { Highlighter } from "shiki";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";
import { getLanguageFromPath } from "../utils/language-detection.js";
import { getHighlighter, highlightCode, type HighlightedToken } from "../utils/syntax-highlighting.js";

// Maximum number of lines to show at once (virtual scrolling)
const MAX_VISIBLE_LINES = 30;

// Maximum cache size to prevent memory leaks
const MAX_CACHE_SIZE = 1000;

// Background color constants
const EDITOR_BG_COLOR_SELECTED = "#444444";
const EDITOR_BG_COLOR_EDITED = "#2A3F2A";

export interface FileEditorProps {
  filePath: Accessor<string | null>;
  fileContent: Accessor<string>;
  selectedLine: Accessor<number>;
  setSelectedLine: Setter<number>;
  editedContent: Accessor<string>;
  setEditedContent: Setter<string>;
  editedLines: Accessor<Map<number, string>>;
}

export function FileEditor(props: FileEditorProps) {
  // Parse file into lines
  const lines = createMemo(() => {
    const content = props.fileContent();
    return content.split('\n');
  });

  // Load highlighter
  const [highlighter] = createResource(getHighlighter);

  // Detect language
  const language = createMemo(() => {
    const path = props.filePath();
    return path ? getLanguageFromPath(path) : "javascript";
  });

  // Virtual scrolling
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      lines(),
      props.selectedLine(),
      MAX_VISIBLE_LINES,
    ),
  );

  // Highlight cache with cleanup
  let highlightCache = new Map<string, HighlightedToken[]>();

  // Clear cache when file path changes to prevent memory leaks
  createEffect(() => {
    const path = props.filePath();
    // Clear cache when file changes
    highlightCache.clear();
  });

  // Clear cache on component cleanup
  onCleanup(() => {
    highlightCache.clear();
  });

  const getHighlightedTokens = (code: string, lang: string, hl: Highlighter | undefined): HighlightedToken[] => {
    if (!hl || code === "") return [{ text: code, color: "#CCCCCC" }];

    const cacheKey = `${lang}:${code}`;
    const cached = highlightCache.get(cacheKey);
    if (cached) return cached;

    const tokens = highlightCode(code, lang, hl);

    // Implement simple cache size limit
    if (highlightCache.size >= MAX_CACHE_SIZE) {
      // Clear half the cache when limit is reached (simple eviction strategy)
      const entries = Array.from(highlightCache.entries());
      highlightCache.clear();
      // Keep the more recent half
      entries.slice(Math.floor(entries.length / 2)).forEach(([key, value]) => {
        highlightCache.set(key, value);
      });
    }

    highlightCache.set(cacheKey, tokens);
    return tokens;
  };

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
          <text fg="#00AAFF">✎ Editing:</text>
          <Show when={props.filePath()}>
            <text fg="#FFFFFF">{props.filePath()}</text>
          </Show>
        </box>
        <box flexDirection="row" gap={2}>
          <text fg="#666666">Line {props.selectedLine() + 1}/{lines().length}</text>
          <Show when={props.editedLines().size > 0}>
            <text fg="#444444">│</text>
            <text fg="#44FF44">{props.editedLines().size} line{props.editedLines().size > 1 ? 's' : ''} modified</text>
          </Show>
        </box>
      </box>

      {/* File Content */}
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
          <For each={scrollWindow().visibleItems}>
            {(line, index) => {
              const lineNumber = () => scrollWindow().start + index() + 1;
              const isSelected = () => scrollWindow().start + index() === props.selectedLine();
              const isEdited = () => props.editedLines().has(lineNumber());

              return (
                <EditorLineView
                  line={line}
                  lineNumber={lineNumber()}
                  isSelected={isSelected()}
                  isEdited={isEdited()}
                  language={language()}
                  highlighter={highlighter()}
                  getHighlightedTokens={getHighlightedTokens}
                  editedContent={props.editedContent}
                  setEditedContent={props.setEditedContent}
                  editedLines={props.editedLines}
                />
              );
            }}
          </For>
        </box>
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
        <text fg="#FFAA00">EDIT MODE</text>
        <text fg="#444444">│</text>
        <text fg="#00AAFF">↑/↓</text>
        <text fg="#AAAAAA">navigate</text>
        <text fg="#444444">│</text>
        <text fg="#00AAFF">Ctrl+S</text>
        <text fg="#AAAAAA">save all</text>
        <text fg="#444444">│</text>
        <text fg="#00AAFF">Esc</text>
        <text fg="#AAAAAA">back to diff</text>
      </box>
    </box>
  );
}

// Single line in the editor
interface EditorLineViewProps {
  line: string;
  lineNumber: number;
  isSelected: boolean;
  isEdited: boolean;
  language: string;
  highlighter: Highlighter | undefined;
  getHighlightedTokens: (code: string, lang: string, hl: Highlighter | undefined) => HighlightedToken[];
  editedContent: Accessor<string>;
  setEditedContent: Setter<string>;
  editedLines: Accessor<Map<number, string>>;
}

function EditorLineView(props: EditorLineViewProps) {
  // Get the actual content to display (edited version if exists, otherwise original)
  const displayContent = () => {
    const edited = props.editedLines().get(props.lineNumber);
    return edited ?? props.line;
  };

  const tokens = () => props.getHighlightedTokens(displayContent(), props.language, props.highlighter);

  const bgColor = () => {
    if (props.isSelected) return EDITOR_BG_COLOR_SELECTED;
    if (props.isEdited) return EDITOR_BG_COLOR_EDITED;
    return "transparent";
  };

  return (
    <box
      width="100%"
      height={1}
      flexDirection="row"
      backgroundColor={bgColor()}
      paddingLeft={1}
    >
      {/* Line number */}
      <box width={6} paddingRight={1}>
        <text fg="#666666">{String(props.lineNumber).padStart(4, " ")}</text>
      </box>

      {/* Modified indicator */}
      <box width={2}>
        <Show when={props.isEdited}>
          <text fg="#FFAA00">*</text>
        </Show>
      </box>

      {/* Content - Show textbox when selected, otherwise syntax highlighted text */}
      <box flexGrow={1} flexDirection="row">
        <Show
          when={props.isSelected}
          fallback={
            <For each={tokens()}>
              {(token) => <text fg={token.color}>{token.text}</text>}
            </For>
          }
        >
          <textbox
            value={props.editedContent()}
            onInput={(val) => props.setEditedContent(val)}
            fg="#FFFFFF"
            bg={bgColor()}
            width="100%"
          />
        </Show>
      </box>
    </box>
  );
}
