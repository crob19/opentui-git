import { onMount } from "solid-js";
import { useDialog } from "./dialog.js";
import type { TextareaRenderable } from "@opentui/core";

/**
 * BranchDialog - Modal dialog for creating a new branch
 */
export interface BranchDialogProps {
  onCreateBranch: (branchName: string) => void;
  onCancel: () => void;
  currentBranch: string;
}

export function BranchDialog(props: BranchDialogProps) {
  const dialog = useDialog();
  let textareaRef: TextareaRenderable | undefined;

  onMount(() => {
    // Focus textarea on mount
    setTimeout(() => {
      textareaRef?.focus();
    }, 10);
  });

  const handleSubmit = () => {
    const branchName = textareaRef?.plainText?.trim();
    if (branchName) {
      // Basic validation: no spaces, no special chars at start
      if (/^[a-zA-Z0-9][\w\-\/\.]*$/.test(branchName)) {
        props.onCreateBranch(branchName);
        dialog.close();
      } else {
        console.log("Invalid branch name. Use alphanumeric, hyphens, underscores, slashes.");
      }
    }
  };

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00AAFF">
        Create New Branch
      </text>
      
      <box flexDirection="row" gap={1}>
        <text fg="#888888">From:</text>
        <text fg="#00FF00">{props.currentBranch}</text>
      </box>
      
      <box flexDirection="column" gap={0}>
        <text fg="#888888">Branch name:</text>
        <textarea
          ref={(el: TextareaRenderable) => (textareaRef = el)}
          height={1}
          width="100%"
          placeholder="feature/my-new-branch"
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
          <text fg="#888888"> create</text>
        </box>
        <box flexDirection="row">
          <text fg="#00AAFF">Esc</text>
          <text fg="#888888"> cancel</text>
        </box>
      </box>
    </box>
  );
}
