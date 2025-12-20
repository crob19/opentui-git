import { useKeyboard } from "@opentui/solid";
import { useDialog } from "./dialog.js";

/**
 * DeleteBranchDialog - Confirmation dialog for deleting a branch
 */
export interface DeleteBranchDialogProps {
  branchName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteBranchDialog(props: DeleteBranchDialogProps) {
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
      <text fg="#FF4444">
        Delete Branch
      </text>
      
      <box flexDirection="column" gap={0}>
        <text fg="#FFFFFF">
          Are you sure you want to delete branch:
        </text>
        <text fg="#FFAA00">
          {props.branchName}
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
