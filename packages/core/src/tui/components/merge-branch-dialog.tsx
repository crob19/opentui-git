import { useKeyboard } from "@opentui/solid";
import { useDialog } from "./dialog.js";

/**
 * MergeBranchDialog - Confirmation dialog for merging a branch
 */
export interface MergeBranchDialogProps {
  sourceBranch: string;
  targetBranch: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MergeBranchDialog(props: MergeBranchDialogProps) {
  const dialog = useDialog();

  useKeyboard((event) => {
    if (!dialog.isOpen) return;

    switch (event.name) {
      case "y":
        props.onConfirm();
        dialog.close();
        event.preventDefault();
        break;
      case "n":
      case "escape":
        props.onCancel();
        dialog.close();
        event.preventDefault();
        break;
    }
  });

  return (
    <box flexDirection="column" gap={1}>
      <text fg="#00AAFF">
        Merge Branch
      </text>
      
      <box flexDirection="column" gap={0}>
        <text fg="#FFFFFF">
          Merge branch:
        </text>
        <text fg="#FFAA00">
          {props.sourceBranch}
        </text>
        <text fg="#FFFFFF">
          into:
        </text>
        <text fg="#44FF44">
          {props.targetBranch}
        </text>
      </box>
      
      <box flexDirection="row" gap={2}>
        <box flexDirection="row">
          <text fg="#44FF44">y</text>
          <text fg="#888888"> confirm</text>
        </box>
        <box flexDirection="row">
          <text fg="#FF4444">n</text>
          <text fg="#888888"> cancel</text>
        </box>
      </box>
    </box>
  );
}
