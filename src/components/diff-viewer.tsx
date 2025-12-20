import { For, Show, type Accessor } from "solid-js";

/**
 * DiffViewer component - Displays the diff for a selected file
 */
export interface DiffViewerProps {
  diff: Accessor<string | null>;
  filePath: Accessor<string | null>;
  isLoading: Accessor<boolean>;
}

interface DiffLine {
  content: string;
  type: "add" | "remove" | "context" | "header";
}

function parseDiffLines(diff: string): DiffLine[] {
  const lines = diff.split("\n");
  return lines.map((line) => {
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
      return { content: line, type: "header" as const };
    } else if (line.startsWith("+")) {
      return { content: line, type: "add" as const };
    } else if (line.startsWith("-")) {
      return { content: line, type: "remove" as const };
    } else {
      return { content: line, type: "context" as const };
    }
  });
}

function getLineColor(type: DiffLine["type"]): string {
  switch (type) {
    case "add":
      return "#44FF44"; // Green
    case "remove":
      return "#FF4444"; // Red
    case "header":
      return "#00AAFF"; // Blue
    case "context":
    default:
      return "#AAAAAA"; // Gray
  }
}

export function DiffViewer(props: DiffViewerProps) {
  const diffLines = () => {
    const diff = props.diff();
    if (!diff) return [];
    return parseDiffLines(diff);
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
        <box flexDirection="column" overflow="hidden">
          <For each={diffLines().slice(0, 50)}>
            {(line) => (
              <text fg={getLineColor(line.type)}>
                {line.content.slice(0, 120) || " "}
              </text>
            )}
          </For>
          <Show when={diffLines().length > 50}>
            <text fg="#888888">... {diffLines().length - 50} more lines (press 'd' to view full diff)</text>
          </Show>
        </box>
      </Show>
    </box>
  );
}
