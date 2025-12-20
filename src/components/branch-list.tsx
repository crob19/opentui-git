import { For, createMemo, type Accessor } from "solid-js";

/**
 * BranchList component - Displays the list of local branches with selection
 */
export interface BranchListProps {
  branches: Accessor<string[]>;
  currentBranch: Accessor<string>;
  selectedIndex: Accessor<number>;
  isActive: Accessor<boolean>;
}

export function BranchList(props: BranchListProps) {
  // Calculate visible window of branches to show (virtual scrolling)
  const visibleBranches = createMemo(() => {
    const branches = props.branches();
    const selected = props.selectedIndex();
    const maxVisible = 10; // Maximum number of branches to show at once
    
    if (branches.length <= maxVisible) {
      return branches;
    }
    
    // Calculate scroll window to keep selected item visible
    let start = Math.max(0, selected - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    
    // Adjust if we're near the end
    if (end > branches.length) {
      end = branches.length;
      start = Math.max(0, end - maxVisible);
    }
    
    return branches.slice(start, end);
  });
  
  // Calculate the starting index for proper selection highlighting
  const startIndex = createMemo(() => {
    const branches = props.branches();
    const selected = props.selectedIndex();
    const maxVisible = 10;
    
    if (branches.length <= maxVisible) {
      return 0;
    }
    
    let start = Math.max(0, selected - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    
    if (end > branches.length) {
      end = branches.length;
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
        Branches ({props.branches().length})
      </text>
      
      <box flexDirection="column" gap={0} overflow="hidden">
        <For each={visibleBranches()}>
          {(branch, index) => {
            const actualIndex = () => startIndex() + index();
            const isSelected = () => actualIndex() === props.selectedIndex();
            const isCurrent = () => branch === props.currentBranch();
            
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
                <text fg={isCurrent() ? "#44FF44" : isSelected() && props.isActive() ? "#FFFFFF" : "#AAAAAA"}>
                  {isCurrent() ? "* " : "  "}
                </text>
                <text fg={isCurrent() ? "#44FF44" : isSelected() && props.isActive() ? "#FFFFFF" : "#AAAAAA"}>
                  {branch}
                </text>
              </box>
            );
          }}
        </For>
        
        {props.branches().length === 0 && (
          <text fg="#888888">
            No branches
          </text>
        )}
      </box>
    </box>
  );
}
