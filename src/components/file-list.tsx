import { For, type Accessor } from "solid-js";
import type { GitFileStatus } from "../types.js";

/**
 * FileList component - Displays the list of changed files with colors and selection
 */
export interface FileListProps {
  files: Accessor<GitFileStatus[]>;
  selectedIndex: Accessor<number>;
  isActive: Accessor<boolean>;
}

export function FileList(props: FileListProps) {
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
    >
      <text fg={props.isActive() ? "#00AAFF" : "#AAAAAA"}>
        Files ({props.files().length})
      </text>
      
      <box flexDirection="column" gap={0}>
        <For each={props.files()}>
          {(file, index) => {
            const isSelected = () => index() === props.selectedIndex();
            // Staged files are green, unstaged use their status color
            const fileColor = () => file.staged ? "#44FF44" : file.color;
            
            return (
              <box
                backgroundColor={isSelected() && props.isActive() ? "#333333" : "transparent"}
                width="100%"
                height={1}
                flexDirection="row"
                alignItems="center"
                paddingLeft={1}
                paddingRight={1}
              >
                <text fg={isSelected() && props.isActive() ? "#FFFFFF" : fileColor()}>
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
