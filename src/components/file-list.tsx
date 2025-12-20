import { For, createMemo, type Accessor } from "solid-js";
import type { GitFileStatus, FileTreeNode } from "../types.js";

/**
 * FileList component - Displays the list of changed files with colors and selection
 */
export interface FileListProps {
  files: Accessor<GitFileStatus[]>;
  flatNodes: Accessor<FileTreeNode[]>;
  selectedIndex: Accessor<number>;
  isActive: Accessor<boolean>;
}

export function FileList(props: FileListProps) {
  // Calculate visible window of nodes to show (virtual scrolling)
  const visibleNodes = createMemo(() => {
    const nodes = props.flatNodes();
    const selected = props.selectedIndex();
    const maxVisible = 20; // Maximum number of items to show at once
    
    if (nodes.length <= maxVisible) {
      return nodes;
    }
    
    // Calculate scroll window to keep selected item visible
    let start = Math.max(0, selected - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    
    // Adjust if we're near the end
    if (end > nodes.length) {
      end = nodes.length;
      start = Math.max(0, end - maxVisible);
    }
    
    return nodes.slice(start, end);
  });
  
  // Calculate the starting index for proper selection highlighting
  const startIndex = createMemo(() => {
    const nodes = props.flatNodes();
    const selected = props.selectedIndex();
    const maxVisible = 20;
    
    if (nodes.length <= maxVisible) {
      return 0;
    }
    
    let start = Math.max(0, selected - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    
    if (end > nodes.length) {
      end = nodes.length;
      start = Math.max(0, end - maxVisible);
    }
    
    return start;
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
                <text fg={isSelected() && props.isActive() ? "#FFFFFF" : color}>
                  {displayName}
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
