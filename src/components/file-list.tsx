import { For, createMemo, type Accessor } from "solid-js";
import type { GitFileStatus } from "../types.js";

/**
 * FileList component - Displays the list of changed files with colors and selection
 */
export interface FileListProps {
  files: Accessor<GitFileStatus[]>;
  selectedIndex: Accessor<number>;
}

export function FileList(props: FileListProps) {
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
    >
      <text fg="#AAAAAA">
        Files ({props.files().length})
      </text>
      
      <box flexDirection="column" gap={0}>
        <For each={props.files()}>
          {(file, index) => {
            const isSelected = createMemo(() => index() === props.selectedIndex());
            const stagedIndicator = file.staged ? "●" : " ";
            
            return (
              <box
                backgroundColor={isSelected() ? "#333333" : "transparent"}
                width="100%"
                height={1}
                flexDirection="row"
                alignItems="center"
                paddingLeft={1}
                paddingRight={1}
              >
                <text fg={file.color}>
                  {stagedIndicator}
                </text>
                <text fg={file.color}>
                  {" " + file.statusText.padEnd(10)}
                </text>
                <text fg={isSelected() ? "#FFFFFF" : file.color}>
                  {file.path}
                </text>
              </box>
            );
          }}
        </For>
        
        {props.files().length === 0 && (
          <text fg="#888888">
            No changes
          </text>
        )}
      </box>
    </box>
  );
}
