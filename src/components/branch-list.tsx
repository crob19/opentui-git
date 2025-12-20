import { For, createMemo, type Accessor } from "solid-js";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";

// Maximum number of branches to show at once in the virtual scroll window
const MAX_VISIBLE_BRANCHES = 10;

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
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      props.branches(),
      props.selectedIndex(),
      MAX_VISIBLE_BRANCHES,
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
        Branches ({props.branches().length})
      </text>
      
      <box flexDirection="column" gap={0} overflow="hidden">
        <For each={scrollWindow().visibleItems}>
          {(branch, index) => {
            const actualIndex = () => scrollWindow().start + index();
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
