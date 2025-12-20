import { createSignal, For, Show } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useDialog } from "./dialog.js";
import type { GitBranchInfo } from "../types.js";

/**
 * BranchSwitcherDialog - Modal dialog for switching branches
 */
export interface BranchSwitcherDialogProps {
  branches: GitBranchInfo;
  onSwitch: (branchName: string) => void;
  onCancel: () => void;
}

export function BranchSwitcherDialog(props: BranchSwitcherDialogProps) {
  const dialog = useDialog();
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  // Get list of branches (current branch first, remote branches filtered out)
  const branchList = () => {
    const current = props.branches.current;
    return props.branches.all
      .filter((b) => !b.startsWith("remotes/")) // Filter out remote branches for simplicity
      .sort((a, b) => {
        // Put current branch first
        if (a === current) return -1;
        if (b === current) return 1;
        return a.localeCompare(b);
      });
  };

  // Handle keyboard navigation within dialog
  useKeyboard((event) => {
    if (!dialog.isOpen) return;

    const list = branchList();
    switch (event.name) {
      case "j":
      case "down":
        setSelectedIndex((prev) => Math.min(prev + 1, list.length - 1));
        event.preventDefault();
        break;
      case "k":
      case "up":
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        event.preventDefault();
        break;
      case "return":
        const selected = list[selectedIndex()];
        if (selected && selected !== props.branches.current) {
          props.onSwitch(selected);
          dialog.close();
        }
        event.preventDefault();
        break;
    }
  });

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00AAFF">
        Switch Branch
      </text>

      <box flexDirection="column" gap={0} maxHeight={15} overflow="hidden">
        <For each={branchList()}>
          {(branch, index) => {
            const isSelected = () => index() === selectedIndex();
            const isCurrent = branch === props.branches.current;

            return (
              <box
                backgroundColor={isSelected() ? "#333333" : "transparent"}
                width="100%"
                height={1}
                flexDirection="row"
                paddingLeft={1}
                paddingRight={1}
              >
                <text fg={isCurrent ? "#44FF44" : isSelected() ? "#FFFFFF" : "#AAAAAA"}>
                  {isCurrent ? "* " : "  "}
                </text>
                <text fg={isCurrent ? "#44FF44" : isSelected() ? "#FFFFFF" : "#AAAAAA"}>
                  {branch}
                </text>
                <Show when={isCurrent}>
                  <text fg="#888888"> (current)</text>
                </Show>
              </box>
            );
          }}
        </For>
      </box>

      <box flexDirection="row" gap={2}>
        <box flexDirection="row">
          <text fg="#00AAFF">↑/↓</text>
          <text fg="#888888"> navigate</text>
        </box>
        <box flexDirection="row">
          <text fg="#00AAFF">Enter</text>
          <text fg="#888888"> switch</text>
        </box>
        <box flexDirection="row">
          <text fg="#00AAFF">Esc</text>
          <text fg="#888888"> cancel</text>
        </box>
      </box>
    </box>
  );
}
