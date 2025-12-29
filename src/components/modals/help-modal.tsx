import type { JSXElement } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useDialog } from "../dialog.js";
import { BaseModal } from "./base-modal.js";

/**
 * Help modal component - Displays all available keyboard shortcuts
 */
export interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal(props: HelpModalProps): JSXElement {
  const dialog = useDialog();

  // Handle keyboard input to close modal
  useKeyboard((event) => {
    if (!dialog.isOpen) return;

    if (event.name === "escape" || event.name === "?") {
      props.onClose();
      dialog.close();
      event.preventDefault();
    }
  });
  const globalCommands = [
    { key: "q", desc: "Quit application" },
    { key: "Ctrl+C", desc: "Quit application" },
    { key: "Tab", desc: "Switch between panels" },
    { key: "p", desc: "Pull from remote" },
    { key: "Shift+P", desc: "Push to remote" },
    { key: "?", desc: "Show this help" },
  ];

  const filesPanelCommands = [
    { key: "↑/k", desc: "Move up" },
    { key: "↓/j", desc: "Move down" },
    { key: "Enter", desc: "View diff / Toggle folder" },
    { key: "Space", desc: "Stage/unstage file" },
    { key: "a", desc: "Stage all files" },
    { key: "u", desc: "Unstage all files" },
    { key: "c", desc: "Commit staged files" },
    { key: "n", desc: "Create new branch" },
    { key: "t", desc: "Create tag" },
    { key: "Ctrl+M", desc: "Toggle diff mode (unstaged/staged/branch)" },
  ];

  const branchesPanelCommands = [
    { key: "↑/k", desc: "Move up" },
    { key: "↓/j", desc: "Move down" },
    { key: "Space", desc: "Checkout branch" },
    { key: "d", desc: "Delete branch" },
    { key: "n", desc: "Create new branch" },
    { key: "t", desc: "Create tag" },
    { key: "Shift+M", desc: "Merge branch into current" },
    { key: "[", desc: "Switch to branches tab" },
    { key: "]", desc: "Switch to tags tab" },
    { key: "Shift+P", desc: "Push tag (on tags tab)" },
  ];

  const diffPanelCommands = [
    { key: "↑/k", desc: "Move up" },
    { key: "↓/j", desc: "Move down" },
    { key: "i", desc: "Enter edit mode" },
    { key: "Ctrl+T", desc: "Toggle view (unified/side-by-side)" },
    { key: "Ctrl+M", desc: "Toggle diff mode (unstaged/staged/branch)" },
    { key: "Esc", desc: "Back to files panel" },
  ];

  const editModeCommands = [
    { key: "↑/↓", desc: "Navigate lines" },
    { key: "Ctrl+S", desc: "Save all changes" },
    { key: "Esc", desc: "Exit edit mode (discard changes)" },
  ];

  const renderCommandGroup = (title: string, commands: { key: string; desc: string }[]) => (
    <box flexDirection="column" gap={0}>
      <text fg="#00AAFF">{title}</text>
      <box flexDirection="column" gap={0} paddingLeft={2}>
        {commands.map((cmd) => (
          <box flexDirection="row" gap={1}>
            <text fg="#FFAA00">{cmd.key.padEnd(12, " ")}</text>
            <text fg="#AAAAAA">{cmd.desc}</text>
          </box>
        ))}
      </box>
      <box height={1} />
    </box>
  );

  return (
    <BaseModal
      title="Keyboard Shortcuts"
      footer={
        <text fg="#666666">Press Esc or ? to close</text>
      }
    >
      <box flexDirection="column" gap={0}>
        {renderCommandGroup("Global", globalCommands)}
        {renderCommandGroup("Files Panel", filesPanelCommands)}
        {renderCommandGroup("Branches Panel", branchesPanelCommands)}
        {renderCommandGroup("Diff Panel", diffPanelCommands)}
        {renderCommandGroup("Edit Mode", editModeCommands)}
      </box>
    </BaseModal>
  );
}
