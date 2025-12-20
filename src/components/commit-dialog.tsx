import { onMount } from "solid-js";
import { useDialog } from "./dialog.js";
import type { TextareaRenderable } from "@opentui/core";

/**
 * CommitDialog - Modal dialog for entering commit message
 */
export interface CommitDialogProps {
  onCommit: (message: string) => void;
  onCancel: () => void;
  stagedCount: number;
}

export function CommitDialog(props: CommitDialogProps) {
  const dialog = useDialog();
  let textareaRef: TextareaRenderable | undefined;

  onMount(() => {
    // Focus textarea on mount
    setTimeout(() => {
      textareaRef?.focus();
    }, 10);
  });

  const handleSubmit = () => {
    const msg = textareaRef?.plainText?.trim();
    if (msg) {
      props.onCommit(msg);
      dialog.close();
    }
  };

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00AAFF">
        Commit {props.stagedCount} staged file{props.stagedCount !== 1 ? "s" : ""}
      </text>
      
      <box flexDirection="column" gap={0}>
        <text fg="#888888">Message:</text>
        <textarea
          ref={(el: TextareaRenderable) => (textareaRef = el)}
          height={3}
          width="100%"
          placeholder="Enter commit message..."
          textColor="#FFFFFF"
          focusedTextColor="#FFFFFF"
          cursorColor="#00AAFF"
          onSubmit={handleSubmit}
          keyBindings={[{ name: "return", action: "submit" }]}
        />
      </box>
      
      <box flexDirection="row" gap={2}>
        <box flexDirection="row">
          <text fg="#00AAFF">Enter</text>
          <text fg="#888888"> commit</text>
        </box>
        <box flexDirection="row">
          <text fg="#00AAFF">Esc</text>
          <text fg="#888888"> cancel</text>
        </box>
      </box>
    </box>
  );
}
