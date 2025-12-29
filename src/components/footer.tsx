import type { Accessor } from "solid-js";
import type { PanelType } from "../commands/types.js";
import { getVersionString } from "../utils/version.js";

/**
 * Footer component - Displays keyboard shortcuts and help text
 */
export interface FooterProps {
  activePanel: Accessor<PanelType>;
}

export function Footer(props: FooterProps) {
  const fileShortcuts = [
    { key: "↑/↓", desc: "navigate" },
    { key: "Enter", desc: "view" },
    { key: "Space", desc: "stage" },
    { key: "c", desc: "commit" },
    { key: "Tab", desc: "switch panel" },
    { key: "?", desc: "help" },
    { key: "q", desc: "quit" },
  ];

  const branchShortcuts = [
    { key: "↑/↓", desc: "navigate" },
    { key: "Space", desc: "checkout" },
    { key: "d", desc: "delete" },
    { key: "Tab", desc: "switch panel" },
    { key: "?", desc: "help" },
    { key: "q", desc: "quit" },
  ];

  const diffShortcuts = [
    { key: "↑/↓", desc: "navigate" },
    { key: "i", desc: "edit" },
    { key: "Ctrl+M", desc: "diff mode" },
    { key: "Esc", desc: "back" },
    { key: "?", desc: "help" },
    { key: "q", desc: "quit" },
  ];

  const shortcuts = () => {
    if (props.activePanel() === "diff") return diffShortcuts;
    if (props.activePanel() === "branches") return branchShortcuts;
    return fileShortcuts;
  };

  return (
    <box
      borderStyle="single"
      borderColor="#444444"
      width="100%"
      height={3}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" alignItems="center" gap={2}>
        {shortcuts().map((shortcut, idx) => (
          <>
            <text fg="#00AAFF">{shortcut.key}</text>
            <text fg="#AAAAAA">{shortcut.desc}</text>
            {idx < shortcuts().length - 1 && <text fg="#444444">│</text>}
          </>
        ))}
      </box>
      <text fg="#666666">{getVersionString()}</text>
    </box>
  );
}
