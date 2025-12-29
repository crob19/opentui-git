import { For, createMemo, Show, type Accessor } from "solid-js";
import { calculateVirtualScrollWindow } from "../utils/virtual-scroll.js";
import type { BranchPanelTab } from "../app.js";

// Maximum number of items to show at once in the virtual scroll window
const MAX_VISIBLE_ITEMS = 10;

/**
 * BranchList component - Displays tabs for branches and tags with selection
 */
export interface BranchListProps {
  branches: Accessor<string[]>;
  currentBranch: Accessor<string>;
  branchSelectedIndex: Accessor<number>;
  tags: Accessor<string[]>;
  tagSelectedIndex: Accessor<number>;
  currentTab: Accessor<BranchPanelTab>;
  isActive: Accessor<boolean>;
}

export function BranchList(props: BranchListProps) {
  // Get the current items and selected index based on active tab
  const currentItems = createMemo(() => {
    return props.currentTab() === "branches" ? props.branches() : props.tags();
  });
  
  const currentSelectedIndex = createMemo(() => {
    return props.currentTab() === "branches" ? props.branchSelectedIndex() : props.tagSelectedIndex();
  });

  // Calculate visible window of items to show (virtual scrolling)
  const scrollWindow = createMemo(() =>
    calculateVirtualScrollWindow(
      currentItems(),
      currentSelectedIndex(),
      MAX_VISIBLE_ITEMS,
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
      {/* Tab headers */}
      <box flexDirection="row" gap={2}>
        <text fg={props.currentTab() === "branches" ? "#00AAFF" : "#888888"}>
          Branches ({props.branches().length})
        </text>
        <text fg="#444444">|</text>
        <text fg={props.currentTab() === "tags" ? "#00AAFF" : "#888888"}>
          Tags ({props.tags().length})
        </text>
      </box>
      
      {/* Branch list */}
      <Show when={props.currentTab() === "branches"}>
        <box flexDirection="column" gap={0} overflow="hidden">
          <For each={scrollWindow().visibleItems}>
            {(branch, index) => {
              const actualIndex = () => scrollWindow().start + index();
              const isSelected = () => actualIndex() === currentSelectedIndex();
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
      </Show>
      
      {/* Tag list */}
      <Show when={props.currentTab() === "tags"}>
        <box flexDirection="column" gap={0} overflow="hidden">
          <For each={scrollWindow().visibleItems}>
            {(tag, index) => {
              const actualIndex = () => scrollWindow().start + index();
              const isSelected = () => actualIndex() === currentSelectedIndex();
              
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
                  <text fg={isSelected() && props.isActive() ? "#FFFFFF" : "#AAAAAA"}>
                    {tag}
                  </text>
                </box>
              );
            }}
          </For>
          
          {props.tags().length === 0 && (
            <text fg="#888888">
              No tags
            </text>
          )}
        </box>
      </Show>
    </box>
  );
}
