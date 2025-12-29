import { createSignal, createMemo, For, type JSXElement } from "solid-js";
import { useKeyboard, useTerminalDimensions } from "@opentui/solid";
import { useDialog } from "../dialog.js";
import { BaseModal } from "./base-modal.js";

/**
 * Help modal component - Displays all available keyboard shortcuts with virtual scrolling
 */
export interface HelpModalProps {
  onClose: () => void;
}

type HelpItem = {
  type: "header" | "command" | "spacer";
  key?: string;
  desc?: string;
};

export function HelpModal(props: HelpModalProps): JSXElement {
  const dialog = useDialog();
  const dimensions = useTerminalDimensions();
  const [scrollIndex, setScrollIndex] = createSignal(0);

  // Calculate available height for content (terminal height - title - footer - borders - padding)
  const maxContentHeight = () => Math.max(10, dimensions().height - 10);

  // Flatten all commands into a single scrollable array
  const allItems = createMemo((): HelpItem[] => {
    const items: HelpItem[] = [];

    // Navigation (common across panels)
    items.push({ type: "header", desc: "Navigation" });
    items.push({ type: "command", key: "↑/k", desc: "Move up" });
    items.push({ type: "command", key: "↓/j", desc: "Move down" });
    items.push({ type: "command", key: "Tab", desc: "Switch between panels" });
    items.push({ type: "spacer" });

    // Global commands
    items.push({ type: "header", desc: "Global" });
    items.push({ type: "command", key: "?", desc: "Show this help" });
    items.push({ type: "command", key: "q", desc: "Quit application" });
    items.push({ type: "command", key: "Ctrl+C", desc: "Quit application" });
    items.push({ type: "command", key: "p", desc: "Pull from remote" });
    items.push({ type: "command", key: "Shift+P", desc: "Push to remote" });
    items.push({ type: "spacer" });

    // Files Panel
    items.push({ type: "header", desc: "Files Panel" });
    items.push({ type: "command", key: "Enter", desc: "View diff / Toggle folder" });
    items.push({ type: "command", key: "Space", desc: "Stage/unstage file or folder" });
    items.push({ type: "command", key: "a", desc: "Stage all files" });
    items.push({ type: "command", key: "u", desc: "Unstage all files" });
    items.push({ type: "command", key: "c", desc: "Commit staged files" });
    items.push({ type: "command", key: "n", desc: "Create new branch" });
    items.push({ type: "command", key: "t", desc: "Create tag" });
    items.push({ type: "command", key: "Ctrl+M", desc: "Toggle diff mode (unstaged/staged/branch)" });
    items.push({ type: "spacer" });

    // Branches Panel
    items.push({ type: "header", desc: "Branches Panel" });
    items.push({ type: "command", key: "Space", desc: "Checkout selected branch" });
    items.push({ type: "command", key: "d", desc: "Delete branch" });
    items.push({ type: "command", key: "n", desc: "Create new branch" });
    items.push({ type: "command", key: "t", desc: "Create tag" });
    items.push({ type: "command", key: "Shift+M", desc: "Merge branch into current" });
    items.push({ type: "command", key: "[", desc: "Switch to branches tab" });
    items.push({ type: "command", key: "]", desc: "Switch to tags tab" });
    items.push({ type: "command", key: "Shift+P", desc: "Push tag (on tags tab)" });
    items.push({ type: "spacer" });

    // Diff Panel
    items.push({ type: "header", desc: "Diff Panel" });
    items.push({ type: "command", key: "i", desc: "Enter edit mode" });
    items.push({ type: "command", key: "Ctrl+T", desc: "Toggle view (unified/side-by-side)" });
    items.push({ type: "command", key: "Ctrl+M", desc: "Toggle diff mode (unstaged/staged/branch)" });
    items.push({ type: "command", key: "Esc", desc: "Back to files panel" });
    items.push({ type: "spacer" });

    // Edit Mode
    items.push({ type: "header", desc: "Edit Mode" });
    items.push({ type: "command", key: "↑/↓", desc: "Navigate lines (arrow keys only)" });
    items.push({ type: "command", key: "Ctrl+S", desc: "Save all changes" });
    items.push({ type: "command", key: "Esc", desc: "Exit edit mode (discard changes)" });

    return items;
  });

  // Virtual scrolling window - for help modal, scrollIndex is the TOP of the window
  const scrollWindow = createMemo(() => {
    const index = scrollIndex();
    const items = allItems();
    const maxHeight = maxContentHeight();
    
    // For help modal, treat scrollIndex as the start position (not selected item)
    // This gives us direct scrolling behavior
    const start = Math.max(0, Math.min(index, items.length - maxHeight));
    const end = Math.min(start + maxHeight, items.length);
    
    return {
      start,
      end,
      visibleItems: items.slice(start, end),
    };
  });

  // Handle keyboard navigation internally
  useKeyboard((event) => {
    if (!dialog.isOpen) return;

    const items = allItems();
    const maxIndex = items.length - 1;
    const pageSize = maxContentHeight();

    switch (event.name) {
      case "escape":
      case "?":
        props.onClose();
        dialog.close();
        event.preventDefault();
        break;
      case "j":
      case "down":
        setScrollIndex((prev) => Math.min(prev + 1, maxIndex));
        event.preventDefault();
        break;
      case "k":
      case "up":
        setScrollIndex((prev) => Math.max(prev - 1, 0));
        event.preventDefault();
        break;
      case "pagedown":
        setScrollIndex((prev) => Math.min(prev + pageSize, maxIndex));
        event.preventDefault();
        break;
      case "pageup":
        setScrollIndex((prev) => Math.max(prev - pageSize, 0));
        event.preventDefault();
        break;
    }
  });

  return (
    <BaseModal
      title="Keyboard Shortcuts"
      footer={
        <text fg="#666666">↑/↓ scroll | Esc/? close</text>
      }
    >
      <box flexDirection="column" gap={0} maxHeight={maxContentHeight()} overflow="hidden">
        <For each={scrollWindow().visibleItems}>
          {(item) => {
            if (item.type === "header") {
              return (
                <box height={1}>
                  <text fg="#00AAFF">{item.desc}</text>
                </box>
              );
            } else if (item.type === "command") {
              return (
                <box flexDirection="row" gap={1} paddingLeft={2} height={1}>
                  <text fg="#FFAA00">{(item.key || "").padEnd(12, " ")}</text>
                  <text fg="#AAAAAA">{item.desc}</text>
                </box>
              );
            } else {
              // spacer
              return <box height={1} />;
            }
          }}
        </For>
      </box>
    </BaseModal>
  );
}
