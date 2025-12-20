import { For, createMemo, type Accessor } from "solid-js";
import type { GitFileStatus, FileTreeNode } from "../types.js";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";

// Maximum number of file items to show at once in the virtual scroll window
const MAX_VISIBLE_FILES = 20;

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
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      props.flatNodes(),
      props.selectedIndex(),
      MAX_VISIBLE_FILES,
    ),
  );

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
        <For each={scrollWindow().visibleItems}>
          {(node, index) => {
            const actualIndex = () => scrollWindow().start + index();
            const isSelected = () => actualIndex() === props.selectedIndex();
            
            // Determine display properties based on node type
            const displayName = () => {
              if (node.type === 'folder') {
                const indicator = node.expanded ? '▼' : '▶';
                return `${'  '.repeat(node.depth)}${indicator} ${node.name}/`;
              } else {
                return `${'  '.repeat(node.depth)}  ${node.name}`;
              }
            };
            
            const color = () => {
              // File nodes show staged status or status color
              if (node.type === 'file' && node.fileStatus) {
                return node.fileStatus.staged ? "#44FF44" : node.color;
              }
              // Folder nodes use their calculated color
              return node.color || "#AAAAAA";
            };
            
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
                <text fg={isSelected() && props.isActive() ? "#FFFFFF" : color()}>
                  {displayName()}
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
